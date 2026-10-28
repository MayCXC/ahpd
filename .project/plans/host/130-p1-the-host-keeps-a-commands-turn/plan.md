---
title: The host keeps a command's turn for its chat
domain: host
status: built
priority: medium
created: 2026-10-27
revalidated: 2026-10-27
requires:
  - plans/host/129-a-tool-results-terminal-lasts-as-long-as-its-chat/plan.md
changes:
  - specs/sessions-and-chats.md
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L1428-L1432](../../../../packages/sdk/src/host/spawn.ts#L1428-L1432) - the end of a `!` turn, where the host already puts back its chat's read bit"
  - "[code://packages/sdk/src/host/spawn.ts#L1547-L1551](../../../../packages/sdk/src/host/spawn.ts#L1547-L1551) - `onTurnRecorded`, which copies a turn's sender to its transcript id"
  - "[code://packages/sdk/src/host/outputs.ts#L126-L167](../../../../packages/sdk/src/host/outputs.ts#L126-L167) - host 129's files in the session's folder: the pattern for a chat's local turns"
  - "[code://packages/sdk/src/host/outputs.ts#L285-L307](../../../../packages/sdk/src/host/outputs.ts#L285-L307) - `forgetChatOutputs` and `moveChatOutputs`, the pattern for a chat that goes or moves"
  - "[code://packages/sdk/src/host/outputs.ts#L199-L219](../../../../packages/sdk/src/host/outputs.ts#L199-L219) - `turnsOf`, a chat's turns for a retained terminal's rebuild, which reads a transcript"
  - "[code://packages/sdk/src/host/history.ts#L374-L392](../../../../packages/sdk/src/host/history.ts#L374-L392) - `past`, the read of a session's first chat"
  - "[code://packages/sdk/src/host/sleep.ts#L315-L318](../../../../packages/sdk/src/host/sleep.ts#L315-L318) - a wake reads the lead chat's transcript"
  - "[code://packages/sdk/src/host/sleep.ts#L355-L358](../../../../packages/sdk/src/host/sleep.ts#L355-L358) - a wake reads each other chat's transcript"
  - "[code://packages/sdk/src/host/snapshots.ts#L432-L436](../../../../packages/sdk/src/host/snapshots.ts#L432-L436) - a chat's snapshot from its transcript"
  - "[code://packages/sdk/src/host/chatactions.ts#L1484-L1548](../../../../packages/sdk/src/host/chatactions.ts#L1484-L1548) - `chat/truncated`, which asks the backend for the cut turn's end point"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1146-L1156](../../../../packages/sdk/src/host/sessionmethods.ts#L1146-L1156) - a fork, which asks the backend for the turn's fork point"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L185-L188](../../../../packages/sdk/src/host/sessionmethods.ts#L185-L188) - a chat that moves to another session takes its record and its outputs"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L218-L219](../../../../packages/sdk/src/host/sessionmethods.ts#L218-L219) - a move that is refused takes them back"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1411-L1414](../../../../packages/sdk/src/host/sessionmethods.ts#L1411-L1414) - `disposeChat`, where a chat goes with its outputs"
  - "[code://packages/agent-acp/src/catalog.ts#L217-L220](../../../../packages/agent-acp/src/catalog.ts#L217-L220) - an ACP record keeps the host's seed, so its transcript can hold local turns already"
  - "[code://packages/sdk/src/utils/jsonfile.ts#L53-L111](../../../../packages/sdk/src/utils/jsonfile.ts#L53-L111) - `readJsonObject` and `writeJsonAtomic`"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/localCommands/localChatCommand.ts#L227-L245 - `_recordLocalTurn`: the completed turn and its anchor
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/localCommands/localChatCommand.ts#L250-L278 - `sanitizeLocalTurnForPersistence`, which drops a terminal that the reference cannot rebuild
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L86-L109 - `record` and `findAnchorTurnId`
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L171-L234 - `parsePersistedTurn` and `interleaveLocalTurns`
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentService.ts#L9802-L9838 - every hydration interleaves, and a fork records the forked local turns in the new chat
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentSideEffects.ts#L1954-L1982 - a truncation at a local turn, and the local turns that it drops
---

## Goal

When a `!` turn ends, the host keeps it as a local turn of its chat, in the session's folder.
A local turn names the turn before it, by the id that the backend's transcript gives that turn.
Every read of a transcript puts the chat's local turns back after the turns that they followed.
A truncation or a fork at a local turn goes to the backend at the turn before it.
Local turns go with their chat, and move with it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "transcript\?\.\(|\.transcript\(" packages/sdk/src/host` - `past`, two reads in a wake, a chat's snapshot and `turnsOf` each pass `outputsFor` beside the read.
- `rg -n "forgetChatOutputs|moveChatOutputs|forgetTurnOutputs" packages/sdk/src` - a chat's dispose, its two moves and a truncation already carry host 129's files.
- `rg -n "endPoint|forkPoint" packages/sdk/src/host` - a truncation and a fork each ask the backend for one point, by the cut turn's id.
- `rg -n "allTurns\(\)" packages/sdk/src/host` - a backend's turns are its own array, so the host reads a local turn from it rather than build one.

### Runtime path

```
the end of a command turn -> spawn's dispatch -> keepLocalTurn -> <session folder>/turns/<chat>/<turn>.json
a transcript read -> the chat's local turns -> after their anchors -> past, a wake's seed, a snapshot, a rebuild
chat/truncated or a fork at a local turn -> the turn before it -> endPoint or forkPoint
```

### Gaps

- The host keeps no turn of a chat, so a `!` turn is lost at a restart.
- The host keeps no transcript id of a turn, so it cannot name a turn the way the transcript will.
- A truncation and a fork at a `!` turn are refused.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The host keeps a local turn when it passes on the end of a turn that it holds in `commandTurns`: `chat/turnComplete`, `chat/turnCancelled` or `chat/error`. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/localCommands/localChatCommand.ts#L201-L224; [code://packages/sdk/src/host/spawn.ts#L1428-L1432](../../../../packages/sdk/src/host/spawn.ts#L1428-L1432) | 01 |
| The local turn is the turn as the chat holds it in `allTurns()` when its end passes. A turn that is not there is not kept. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/localCommands/localChatCommand.ts#L235-L245 | 01 |
| Departure from the reference: a local turn keeps its terminal content, because host 129 rebuilds a `!` terminal from its kept output after a restart. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/localCommands/localChatCommand.ts#L250-L253, which drops it because "the PTY does not survive a reload"; [code://packages/sdk/src/host/outputs.ts#L221-L262](../../../../packages/sdk/src/host/outputs.ts#L221-L262) | 01 |
| One JSON file per local turn: the session's folder, then `turns`, then the hex SHA-256 of the chat and of the turn id, written with `writeJsonAtomic`. | [code://packages/sdk/src/host/outputs.ts#L126-L167](../../../../packages/sdk/src/host/outputs.ts#L126-L167) | 01 |
| A file holds `{ version: 1, turnId, anchor?, seq, turn }`. `seq` is one more than the chat's highest, and orders the local turns of one anchor. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L86-L92 | 01 |
| A store with no session folder keeps no local turn, as it keeps no output. | [code://packages/sdk/src/host/outputs.ts#L128-L131](../../../../packages/sdk/src/host/outputs.ts#L128-L131) | 01 |
| The anchor is the nearest turn before the local turn that is not a local turn itself. There is no anchor when there is no such turn. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L100-L109 | 01 |
| The anchor is written as the transcript id that `onTurnRecorded` gave that turn in this process, and as the turn's own id when no backend gave one. | [code://packages/sdk/src/types/agent.ts#L517-L530](../../../../packages/sdk/src/types/agent.ts#L517-L530) | 01 |
| The host holds each chat's transcript ids in memory, from `onTurnRecorded`, and forgets them with the chat. | [code://packages/sdk/src/host/spawn.ts#L1547-L1551](../../../../packages/sdk/src/host/spawn.ts#L1547-L1551) | 01 |
| A file is checked as the reference checks a record: the turn's `id` is the file's `turnId`, and it has a `message.text`, a `message.origin.kind`, `responseParts` and a `state`. A file that fails is skipped. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L171-L200 | 02 |
| Every read of a transcript goes through one host read that adds `outputsFor` and puts the local turns back. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentService.ts#L9802-L9814 | 02 |
| The local turns with no anchor go first, then each after its anchor in `seq` order. One whose anchor the transcript does not hold is dropped. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L202-L234 | 02 |
| A local turn that the transcript holds already stays where the transcript has it. The other local turns of its anchor go in around it by `seq`, and none goes in twice. | `(defaulted: an ACP record keeps the host's seed, which carries the local turns, [code://packages/agent-acp/src/catalog.ts#L217-L220](../../../../packages/agent-acp/src/catalog.ts#L217-L220))` | 02 |
| A truncation at a local turn asks the backend for the end point of the turn before it. With no such turn, it is refused as a clear of the whole conversation is. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentSideEffects.ts#L1960-L1966; [code://packages/sdk/src/host/chatactions.ts#L1486-L1498](../../../../packages/sdk/src/host/chatactions.ts#L1486-L1498) | 03 |
| A truncation forgets the local turns that it drops. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentSideEffects.ts#L1977-L1981 | 03 |
| A fork at a local turn asks the backend for the fork point of the turn before it, and is refused when there is none. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentService.ts#L7183-L7195 | 03 |
| A fork keeps the forked local turns for the new chat, with their anchors and their order, and gives the new chat the transcript ids of the turns that it copied. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentService.ts#L9828-L9838 | 03 |
| A chat's local turns go with the chat at `disposeChat`, and move with it to another session. | [code://packages/sdk/src/host/outputs.ts#L285-L307](../../../../packages/sdk/src/host/outputs.ts#L285-L307) | 04 |
| `docs/sdk/TERMINALS.md`, `docs/sdk/CHATS.md`, `docs/sdk/AGENT.md`, the spec and a `0.14.1 - unreleased` changelog entry say what the host keeps. | `(defaulted: specs and docs corrected in place)` | 05 |

## Proposed architecture

- **Data flow** - `spawn` keeps a command turn at its end; one host read gives every transcript read its outputs and its local turns.
- **Event flow** - nothing new: a local turn goes out in the snapshots that already carry a chat's turns.
- **State flow** - a chat's transcript ids live in memory from `onTurnRecorded`; local turns live in the session's folder.
- **Layer responsibilities** - `@ahpd/sdk` only: `host/localturns.ts`, `spawn`, the five reads, `chatactions` and `sessionmethods`.
- **Source-of-truth files** - `packages/sdk/src/host/localturns.ts`, which task 01 creates.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A command's turn is kept when it ends](task-01-a-commands-turn-is-kept-when-it-ends.md) | done | - |
| [02 - A transcript read puts the local turns back](task-02-a-transcript-read-puts-the-local-turns-back.md) | done | 01 |
| [03 - A cut at a local turn goes to the turn before it](task-03-a-cut-at-a-local-turn-goes-to-the-turn-before-it.md) | done | 01 |
| [04 - Local turns go and move with their chat](task-04-local-turns-go-and-move-with-their-chat.md) | done | 01 |
| [05 - The docs say what the host keeps](task-05-the-docs-say-what-the-host-keeps.md) | done | 02, 03, 04 |

## Risks and tradeoffs

- A transcript read now also reads one folder of small files per chat - only a chat with local turns has the folder.
- A turn that never reached the transcript anchors nothing after a restart - the local turn after it is dropped as an orphan.

## Resume state

- **Done so far:** planned and built 2026-10-27; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a turn in `allTurns()` has the client's id until a restart, so an anchor is always the transcript's id.

## Final verification checklist

- [x] Each case fails on the code before this plan.
- [x] `pnpm boundary`, `pnpm typecheck`, `pnpm build` and the sdk suite pass.
- [x] `plans/index.md` updated.
