---
title: A shell's marks stay out of its output
domain: host
status: built
priority: high
created: 2026-10-27
revalidated: 2026-10-27
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L226-L239](../../../../packages/sdk/src/machines/terminals.ts#L226-L239) - `MARKS`, the OSC 133 and OSC 7 marks the store reads"
  - "[code://packages/sdk/src/machines/terminals.ts#L362-L403](../../../../packages/sdk/src/machines/terminals.ts#L362-L403) - `marked`, which reads the marks of a chunk before the chunk is said whole"
  - "[code://packages/sdk/src/machines/terminals.ts#L421-L427](../../../../packages/sdk/src/machines/terminals.ts#L421-L427) - the data and the exit of a pseudoterminal, and command detection said at the start"
  - "[code://packages/sdk/src/machines/terminals.ts#L541-L544](../../../../packages/sdk/src/machines/terminals.ts#L541-L544) - `supportsCommandDetection`, true under every pseudoterminal"
  - "[code://packages/sdk/src/machines/terminals.ts#L317-L330](../../../../packages/sdk/src/machines/terminals.ts#L317-L330) - the scrollback, one string capped at 200,000 characters and sent as one part"
  - "[code://packages/sdk/src/host/spawn.ts#L201-L214](../../../../packages/sdk/src/host/spawn.ts#L201-L214) - `absorb`, which folds a chat's actions with the protocol package's own `chatReducer`"
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L831-L853 - how the reference host trims its content parts
  - "[code://packages/sdk/test/pty.test.ts#L251-L333](../../../../packages/sdk/test/pty.test.ts#L251-L333) - the cases for a shell under a pseudoterminal"
  - "[code://docs/sdk/TERMINALS.md#L73-L79](../../../../docs/sdk/TERMINALS.md#L73-L79) - \"Command boundaries\", which says the marks reach the client"
  - "[code://docs/sdk/AHP.md#L308-L313](../../../../docs/sdk/AHP.md#L308-L313) - the rows for the actions a mark makes"
  - https://microsoft.github.io/agent-host-protocol/specification/terminal-channel - "The server MUST NOT include shell integration escape sequences in `terminal/data`"
  - https://github.com/microsoft/agent-host-protocol/blob/362bf618bba1ecc8b56b3ee64aaf31c55050c0ec/docs/guide/terminals.md - the reason for the rule, a false positive in the check of a client for real output
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `TerminalCommandDetectionAvailableAction`, sent "when shell integration becomes available", and `TerminalCommandFinishedAction`, whose data since `terminal/commandExecuted` is the output of the command
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L654-L715 - the reference host, which says output and sequences in the order they arrive and announces detection with the first sequence
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/copilot/copilotNonPtyShellTerminals.ts#L59-L60 - the bound of the reference host on an escape sequence it holds back
---

## Goal

A shell under a pseudoterminal prints OSC 133 and OSC 7 marks in its output.
The host reads them, and it also sends them to the client in `terminal/data`.
The protocol says a server must not do that, because a client then counts the marks as output.
The host also announces command detection when a pseudoterminal opens, also for a shell that prints no marks.
And it says the actions of a chunk before the output of that chunk, so the end of an output can fall outside its command.
A client that subscribes late gets all the output as one part, also when the shell marked its commands.
With this plan, the host takes the marks out of the output.
It says each action where its mark stood, and it announces detection with the first mark.
A late client gets the parts that a client watching from the start built.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n -i "OSC 133|commandDetectionAvailable|supportsCommandDetection|reader, not a filter" .project/` - no spec, rule or decision names this behaviour.
- `rg -n "133;" packages/*/test` - the cases are in `packages/sdk/test/pty.test.ts`, and the reducer fixtures are in `packages/sdk/test/fixtures/ahp-test-cases/reducers/`.

### Runtime path

```
pty data -> read -> said (terminal/data) and meant (terminal/commandExecuted, terminal/commandFinished, terminal/cwdChanged, terminal/commandDetectionAvailable) -> terminal channel -> the reducer of the client
```

### Gaps

- `terminal/data` carries the OSC 133 and OSC 7 marks, which the protocol forbids.
- `terminal/commandDetectionAvailable` goes out when the pseudoterminal opens, before any shell integration exists.
- `supportsCommandDetection` is true for a shell that prints no marks.
- The actions of a chunk go out before its output, so output before a `D` mark goes out after `terminal/commandFinished`.
- The host does not read a mark that two chunks split, and the mark reaches the client.
- `state()` sends the output as one `unclassified` part, also when the shell marks commands.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The marks the host reads, OSC 133 and OSC 7, do not go out in `terminal/data`. | https://microsoft.github.io/agent-host-protocol/specification/terminal-channel ("The server MUST NOT include shell integration escape sequences in `terminal/data`") | 01 |
| Other escape sequences, such as a title, go out as they arrived. | [code://packages/sdk/src/machines/terminals.ts#L226-L239](../../../../packages/sdk/src/machines/terminals.ts#L226-L239), the marks the host reads | 01 |
| The output before a mark goes out before the action of the mark. | npm://@microsoft/agent-host-protocol@^1.0.0, `TerminalCommandFinishedAction`: the data since `terminal/commandExecuted` is the output of the command | 01 |
| `terminal/commandDetectionAvailable` goes out with the first OSC 133 mark, and `supportsCommandDetection` is true from then on. | npm://@microsoft/agent-host-protocol@^1.0.0, `TerminalCommandDetectionAvailableAction`: sent "when shell integration becomes available" | 01 |
| An OSC 7 mark alone does not announce detection. | `(defaulted: OSC 7 is a directory and says nothing about command boundaries)` | 01 |
| The end of a chunk that can start a mark waits for the next chunk, up to 1,024 characters, and goes out when the shell exits. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/copilot/copilotNonPtyShellTerminals.ts#L59-L60 | 01 |
| `TERMINALS.md` and `AHP.md` say what a client receives. | `.agents/skills/do-spec/SKILL.md`, which corrects the docs in place | 02 |
| The `content` of a snapshot is the parts that the protocol package's own `terminalReducer` builds from the actions the store sends. | https://microsoft.github.io/agent-host-protocol/specification/terminal-channel ("`content` is an ordered array of typed parts", and a retained terminal returns "the retained `TerminalContentPart[]`"); [code://packages/sdk/src/host/spawn.ts#L201-L214](../../../../packages/sdk/src/host/spawn.ts#L201-L214), the same fold with `chatReducer` | 03 |
| Past 200,000 characters, whole parts go from the front, and then the oldest characters of the first part. | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L831-L853 for the order; [code://packages/sdk/src/machines/terminals.ts#L317-L330](../../../../packages/sdk/src/machines/terminals.ts#L317-L330) for the bound | 03 |

## Proposed architecture

- **Data flow** - each chunk from the pseudoterminal goes through `read`, which says the output between the marks and holds back an unfinished mark.
- **Event flow** - `meant` makes the action of each mark at the place where the mark stood.
- **State flow** - `detected` becomes true with the first OSC 133 mark, and `state()` reports it.
- **Layer responsibilities** - `@ahpd/sdk`: the terminal store reads and removes the marks · the reducer of the client: it builds the command parts from the actions.
- **Source-of-truth files** - [`code://packages/sdk/src/machines/terminals.ts`](../../../../packages/sdk/src/machines/terminals.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The store takes the marks out, in the order they came](task-01-the-store-takes-the-marks-out-in-order.md) | done | - |
| [02 - The docs say what a client receives](task-02-the-docs-say-what-a-client-receives.md) | done | 01 |
| [03 - A late client reads the command parts](task-03-a-late-client-reads-the-command-parts.md) | done | 01 |

## Risks and tradeoffs

- A client that drew decorations from the marks does not receive them - the protocol actions carry the same facts, and the protocol requires the removal.
- A split mark longer than 1,024 characters goes out as output - this is the bound of the reference host.
  With it, a sequence that never ends cannot hold back output.

## Resume state

- **Done so far:** planned and built 2026-10-27; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** this plan changes two cases in `packages/sdk/test/pty.test.ts`: detection at the start, and the marks in the data.

## Final verification checklist

- [x] `pnpm boundary`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
- [x] The cases in `packages/sdk/test/pty.test.ts` hold the removal, the order, the split mark and the first mark.
- [x] `plans/index.md` updated.
