---
title: The permission mode a session asks for is sent
domain: acp
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
refs:
  - "[code://packages/agent-acp/src/session.ts#L118](../../../../packages/agent-acp/src/session.ts#L118) - the settings start as the host's `start.settings`, with the asked `permissionMode`"
  - "[code://packages/agent-acp/src/session/config.ts#L42-L46](../../../../packages/agent-acp/src/session/config.ts#L42-L46) - `learnModes` writes the server's current mode over `permissionMode`"
  - "[code://packages/agent-acp/src/session/config.ts#L89-L93](../../../../packages/agent-acp/src/session/config.ts#L89-L93) - `learnOffers` does the same through a `mode` option"
  - "[code://packages/agent-acp/src/session/config.ts#L124-L128](../../../../packages/agent-acp/src/session/config.ts#L124-L128) - `configChanged` says nothing for the value already in force"
  - "[code://packages/agent-acp/src/session/config.ts#L281-L318](../../../../packages/agent-acp/src/session/config.ts#L281-L318) - `setConfig('permissionMode')`, which sends through a `mode` option or `session/set_mode`"
  - "[code://packages/agent-acp/src/session/opening.ts#L454-L516](../../../../packages/agent-acp/src/session/opening.ts#L454-L516) - fork, resume or load, and new each learn the server's state, then `onHandshake`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L109-L114](../../../../packages/agent-acp/src/session/handlers.ts#L109-L114) - a `current_mode_update` goes through `configChanged`"
  - "[code://packages/agent-acp/test/fixtures/acp-server.mjs#L207-L215](../../../../packages/agent-acp/test/fixtures/acp-server.mjs#L207-L215) - the fixture starts in `ask` and offers `ask` and `code`"
  - "[code://packages/agent-acp/test/agent-acp-catalog.test.ts#L455-L469](../../../../packages/agent-acp/test/agent-acp-catalog.test.ts#L455-L469) - the test of a mode set after the open"
---

## Goal

An ACP session that starts with a `permissionMode` runs in that mode.
Today the bridge writes the server's current mode over the asked one at the open, so the asked mode never reaches the server.

## Reconnaissance

### Searches performed

- `grep -n "learnModes\|learnOffers\|learnModels" packages/agent-acp/src/session/opening.ts`: each open path calls the three in turn.
- `grep -n "permissionMode" packages/agent-acp/src packages/agent-acp/test`: no test starts a session with a mode.

### Runtime path

1. `session.ts:118` copies `start.settings` into `settings`, with the asked `permissionMode`.
2. `opening.ts` opens the session by fork, by resume or load, or as new.
3. Each path calls `learnModes`, `learnOffers` and `learnModels` on the server's answer.
4. `learnModes` sets `settings.permissionMode` to the server's `currentModeId`.
5. A `--modes` server also names a `mode` option, and `learnOffers` sets the same key from it.
6. `onHandshake` runs, and `config.values` reports the server's mode.
7. Nothing sends the asked mode.

### What is true now

- `setConfig('permissionMode')` calls `ctx.open()`, so the open itself cannot call it.
- A reopen after a death runs the same path, so a mode set before the death is lost too.
- `learnModels` writes the server's model over `settings.model` the same way. This plan does not change that.

### Gaps

- None found.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The open sends the asked mode when the server offers it and is not in it | Softov, 2026-10-16, chose "Plan it" | 01, 02 |
| A mode the server does not offer is not sent, and the server's mode stays in force | (defaulted: the server refuses a mode it does not name) | 01 |
| A failed send is logged, and the open goes on in the server's mode | (defaulted: a session that runs in another mode is better than no session) | 01 |
| The asked mode goes through a `mode` option when there is one, else `session/set_mode` | (defaulted: the same order as `setConfig`) | 01 |
| The asked model and the `acp.*` options are not in this plan | (defaulted: the request names the mode only) | - |

## Proposed architecture

### Data flow

1. The open reads the asked mode from `settings.permissionMode` before it learns the server's state.
2. After the three learn calls, it checks that the server offers the asked mode and is in another one.
3. If so, it puts the asked mode in `settings` and sends it on the open connection.
4. The server's `current_mode_update` then matches `settings`, so `configChanged` says nothing.

### Layer responsibilities

- `config.ts` holds the send, beside `setConfig`, and takes the connection and session id from the caller.
- `opening.ts` reads the asked mode and calls the send on every open path, before `onHandshake`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The open sends the asked mode](task-01-the-open-sends-the-asked-mode.md) | implemented | - |
| [02 - A test opens a session in its asked mode](task-02-a-test-opens-in-the-asked-mode.md) | todo | 01 |

## Risks and tradeoffs

- The open makes one more request when the modes differ, so a first turn starts a little later.
- A server that offers the mode but refuses it leaves the session in its own mode, with only a log line.

## Resume state

- **Done so far:** planned 2026-10-16 from Softov's request. Task 01 is implemented 2026-10-18, not reviewed. The open sends the asked mode on every path, through `ctx.sendAskedMode` and not `setConfig`.
- **Next action:** task 02, the tests of a session opened in its asked mode.
- **Open questions:** none.
- **Watch out for:** the send must not go through `setConfig`, because `setConfig` calls `ctx.open()`.

## Final verification checklist

- [ ] A test: a session that asks for `code` sends it and reports `code`, with and without `--modes`.
- [ ] A test: a session that asks for a mode the server does not offer reports the server's mode.
- [ ] The gates pass: build, typecheck, boundary, schema and vitest on agent-acp.
- [ ] `plans/index.md` updated.
