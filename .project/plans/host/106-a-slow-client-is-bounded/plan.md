---
title: A slow client is bounded
domain: host
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/listen.ts#L189-L195](../../../../packages/sdk/src/listen.ts#L189-L195) - Bun: `ws.send(text)` with no check of what is still queued"
  - "[code://packages/sdk/src/listen.ts#L248-L254](../../../../packages/sdk/src/listen.ts#L248-L254) - Deno: `socket.send(text)`, the same"
  - "[code://packages/sdk/src/listen.ts#L341-L347](../../../../packages/sdk/src/listen.ts#L341-L347) - Node `ws`: `socket.send(text)`, the same"
  - "[code://packages/sdk/src/listen.ts#L526-L535](../../../../packages/sdk/src/listen.ts#L526-L535) - stdio: `output.write` with no check of its return"
  - "[code://packages/sdk/src/types/rpc.ts#L17-L24](../../../../packages/sdk/src/types/rpc.ts#L17-L24) - `Wire`: `send`, `close` and `isOpen`, and nothing for queued bytes"
  - "[code://packages/sdk/src/rpc.ts#L145-L150](../../../../packages/sdk/src/rpc.ts#L145-L150) - `peer.send` writes whenever the wire is open"
  - "[code://packages/sdk/src/host/root.ts#L218-L300](../../../../packages/sdk/src/host/root.ts#L218-L300) - `ROOT_CONFIG_SCHEMA`, where the two keys go beside `changeWords`"
  - "[code://packages/sdk/src/host.ts#L370-L379](../../../../packages/sdk/src/host.ts#L370-L379) - `REPLAY = 1000` envelopes, a count and no byte budget"
  - "[code://packages/sdk/src/host.ts#L644-L646](../../../../packages/sdk/src/host.ts#L644-L646) - each action is cloned into the buffer, then sent to every watcher"
  - "[code://packages/sdk/src/host.ts#L500-L512](../../../../packages/sdk/src/host.ts#L500-L512) - `broadcast` notifies every watching connection"
  - "[code://packages/sdk/src/host/handshake.ts#L463-L490](../../../../packages/sdk/src/host/handshake.ts#L463-L490) - a reconnect replays from the buffer, or sends snapshots past its oldest entry"
  - "[code://packages/sdk/src/sessions/paging.ts#L14-L22](../../../../packages/sdk/src/sessions/paging.ts#L14-L22) - `PAGE = 50` turns, a count and no byte budget"
  - "[code://packages/sdk/src/host/snapshots.ts#L399](../../../../packages/sdk/src/host/snapshots.ts#L399) - a snapshot carries the newest page of turns, each with its tool calls whole"
  - "[code://docs/sdk/AHP.md#L83](../../../../docs/sdk/AHP.md#L83) - the docs row for `reconnect`"
  - npm://@types/ws@8.18.1 - `WebSocket.bufferedAmount`
  - https://bun.sh/docs/api/websockets - Bun: `getBufferedAmount`, `backpressureLimit` and `closeOnBackpressureLimit`
  - https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/bufferedAmount - `bufferedAmount`, which Deno's `WebSocket` has
  - "file:///github/agent-host-protocol/docs/specification/lifecycle.md - a gap past the replay buffer gets snapshots, not an error"
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/webSocketTransport.ts#L87-L92 - VS Code's `send` checks `readyState` only
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/protocolServerHandler.ts#L103-L104 - `REPLAY_BUFFER_CAPACITY = 1000`, a count
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/protocolServerHandler.ts#L3185-L3188 - the buffer drops its oldest envelope past the count
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/common/sessionDataService.ts#L19 - `MAX_TERMINAL_OUTPUT_BYTES`, the one byte limit on tool output
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/claude/claudeTerminalOutput.ts#L72 - the Claude agent reads a terminal output file up to that limit
---

## Goal

A client that reads slower than the host writes cannot make the host hold an unbounded queue for it.
The replay buffer has a byte budget as well as a count, so a few large actions cannot fill memory.

## Reconnaissance

The files read are the `refs` above, each with its note.

### Searches performed

- `grep -n "bufferedAmount\|getBufferedAmount\|backpressure" packages/sdk/src`: nothing.
- `grep -n "send(" packages/sdk/src/listen.ts`: three socket sends and one pipe write, none checked.
- `grep -n "REPLAY\|structuredClone" packages/sdk/src/host.ts`: the count of 1000 and the clone.
- In VS Code, `bufferedAmount`, `REPLAY_BUFFER_CAPACITY` and `MAX_.*_BYTES` under `src/vs/platform/agentHost`.

### Runtime path

1. A backend emits an action, and `dispatch` clones it into `replayable`.
2. `broadcast` serialises the envelope once per watching connection and calls `peer.notify`.
3. `peer.send` calls `wire.send` while the wire is open.
4. The socket queues the frame in memory until the client reads it.
5. A client that stops reading keeps its socket open, and its queue grows with every action.

### What is true now

- One queue per connection grows without a limit while that client stalls.
- Bun's server queues to its `backpressureLimit`, and does not close by default.
- Node `ws` and Deno queue without a limit, and report the queue in `bufferedAmount`.
- The replay buffer keeps 1000 envelopes, whatever their size.
- A streamed tool call keeps its whole content in the chat state, so a snapshot carries it whole.
- VS Code's agent host has the same shape: `send` checks only `readyState`, and its replay buffer is 1000 envelopes.
- VS Code limits terminal output by bytes when it reads it back, and no other tool output.

### Gaps

- `Not found: a byte measure of an envelope - searched "byteLength\|length" in packages/sdk/src/host.ts`.
- `Not found: a close code for a slow client - searched "close(" in packages/sdk/src/listen.ts`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The plan covers socket queues and the replay buffer's bytes | Softov, 2026-10-16, approved the plan | 01-05 |
| A peer with no measure, such as the in-process pair, is not limited | (defaulted: nothing queues there) | 01 |
| A frame goes out when the queue is under the limit, whatever its own size | (defaulted: one large snapshot must still reach a client that reads) | 03 |
| A replay buffer past its budget drops its oldest envelopes, as it does past its count | (defaulted: the protocol answers a longer gap with snapshots) | 04 |
| An envelope's size is the length of its serialised text, taken once when it is buffered | (defaulted: `broadcast` serialises it anyway) | 04 |
| A client past its queue limit is closed and logged, and reconnects to a replay or snapshots | Softov, 2026-10-16, chose "Close and log" for "What happens to a client whose queue is past the limit?" | 03 |
| The limits are host root config keys, 16 MiB queued per client and 32 MiB for the replay buffer by default | Softov, 2026-10-16, chose "Config keys with defaults" for "What are the limits?" | 02, 03, 04, 05 |
| A preview of a large tool output is out of scope | Softov, 2026-10-16, chose "Out of scope" for "Is a preview of a large tool output in scope?" | - |
| The keys are `clientQueueBytes` and `replayBytes`, integers in bytes with a 1 MiB minimum, pushed under `config:write` | (defaulted: plain names beside `changeWords`, and the grant every host key needs) | 02 |

## Proposed architecture

### Data flow

1. Each wire reports the bytes it still holds for its client.
2. Before a send, the peer reads that number and compares it with the limit.
3. Past `clientQueueBytes`, the peer closes the wire, and the host logs it.
4. A closed client reconnects, and gets a replay or snapshots as now.
5. The replay buffer drops its oldest envelopes while its bytes are over `replayBytes`.

### Layer responsibilities

- `types/rpc.ts`: `Wire` gets an optional `buffered()`.
- `host/root.ts` and `host/limits.ts`: the two keys, their defaults and a reader.
- `listen.ts`: each listener reports its socket's queue, and stdio its stream's.
- `rpc.ts`: the peer checks the queue against the key before each send.
- `host.ts`: the replay buffer keeps a byte total beside its count.
- `docs/sdk/AHP.md`: the `reconnect` row, a note on slow clients and the two keys.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Each wire reports what it holds](task-01-each-wire-reports-what-it-holds.md) | done | - |
| [02 - The limits are host config keys](task-02-the-limits-are-host-config-keys.md) | done | - |
| [03 - A client past the limit is closed](task-03-a-client-past-the-limit-is-closed.md) | done | 01, 02 |
| [04 - The replay buffer has a byte budget](task-04-the-replay-buffer-has-a-byte-budget.md) | done | 02 |
| [05 - The docs name the limits](task-05-the-docs-name-the-limits.md) | done | 02, 03, 04 |

## Risks and tradeoffs

- A client on a slow link that reads, but slowly, is closed during a burst, and reconnects to snapshots.
- A byte budget can hold fewer than 1000 envelopes, so more reconnects get snapshots.
- Measuring each buffered envelope costs one more serialisation, unless the text from `broadcast` is reused.
- A large tool output still reaches every client whole. A preview is out of scope here.

## Resume state

- **Done so far:** drafted 2026-10-16 from Softov's request. Planned 2026-10-16 with Softov's answers. Task 01 implemented 2026-10-16: every wire reports the bytes it still holds, and the in-process pair reports none. Task 02 implemented 2026-10-16: `clientQueueBytes` and `replayBytes` are root config keys with 16 MiB and 32 MiB defaults and a 1 MiB floor, read through `host/limits.ts` where they are used. Task 03 implemented 2026-10-16: a send to a client whose queue is past `clientQueueBytes` logs the line, closes the wire and drops the frame, `accept` binds every connection's peer with the reader of that key, and the tests cover the close, the client beside it, and the closed client coming back to a replay or snapshots. Task 04 implemented 2026-10-16: the replay buffer keeps a byte total beside its count, measured once per push as the length of the envelope's serialised text, and drops its oldest while either limit is passed while keeping the newest, so a reconnect inside the buffer replays and one before it gets snapshots. Task 05 implemented 2026-10-16: `AHP.md` names both limits in the `reconnect` row, says what the host does with a client that stops reading in its own section, and lists the two keys with their defaults and the grant among the keys this host acts on; `pnpm -s docs:build` passes. Reviewed and merged in `1fed4b68`.
- **Next action:** none. The plan is built.
- **Open questions:** none.
- **Watch out for:** `peer.send` also carries answers to requests, so a close drops a pending answer with the socket. The two keys are declared `type: 'number'` with the floor in the description, because the protocol's property schema carries no `minimum` and no `integer` and `wire.test.ts` closes it - see task 02's Resume. A listener's own `clientQueueBytes` is overridden by `accept` wherever a host is behind the listener, so it only binds a listener with no host; both are exercised by `listen.test.ts`. Task 05's "transport section" does not exist in `AHP.md`, so the note on a slow client went into `## Behaviour worth knowing` after `### Restarts`, which is where that file describes the connection rather than an action. `docs/sdk/HOST.md`'s `## Root config` table says the host's own schema is two keys and names neither `changeWords` nor the two new ones, which was already short of `changeWords` before this plan; it is not in any task's `Files` and is left alone.

## Final verification checklist

- [x] A test: a client that stops reading is closed past `clientQueueBytes`, and another client goes on.
- [x] A test: both keys are in the root schema with their defaults, and a push changes the limit.
- [x] A test: a client that reconnects after it was closed gets a replay or snapshots.
- [x] A test: large actions drop the oldest envelopes from the replay buffer before 1000 are held.
- [x] The gates pass: build, typecheck, boundary, schema and vitest.
- [x] `pnpm -s docs:build` passes.
- [x] `plans/index.md` updated.
