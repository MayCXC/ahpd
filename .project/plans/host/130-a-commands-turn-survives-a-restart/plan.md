---
title: A `!` command's turn survives a restart
domain: host
status: built
priority: medium
created: 2026-10-27
revalidated: 2026-10-28
requires:
  - plans/host/129-a-tool-results-terminal-lasts-as-long-as-its-chat/plan.md
changes:
  - specs/sessions-and-chats.md
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L1372-L1387](../../../../packages/sdk/src/host/lifecycle.ts#L1372-L1387) - the host hands a `!` command to the backend's `ran`, and no agent sees it"
  - "[code://packages/sdk/src/host/history.ts#L374-L392](../../../../packages/sdk/src/host/history.ts#L374-L392) - after a restart, a session's turns are its transcript's"
  - "[code://packages/sdk/src/host/spawn.ts#L1547-L1551](../../../../packages/sdk/src/host/spawn.ts#L1547-L1551) - `onTurnRecorded`, the port that names a turn's transcript id"
  - "[code://packages/agent-claude/src/transcript.ts#L325](../../../../packages/agent-claude/src/transcript.ts#L325) - a Claude turn read back is named by the CLI's own uuid"
  - "[code://packages/agent-cofold/src/transcript.ts#L322](../../../../packages/agent-cofold/src/transcript.ts#L322) - a cofold turn read back is named by its prompt's message id"
  - "[code://packages/agent-pi/src/replay.ts#L127-L130](../../../../packages/agent-pi/src/replay.ts#L127-L130) - a pi turn read back is named by its prompt's entry id"
  - "[code://packages/agent-acp/src/transcript.ts#L110-L120](../../../../packages/agent-acp/src/transcript.ts#L110-L120) - an ACP turn that its server replays gets a new UUID"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/localCommands/localChatCommand.ts#L201-L245 - the reference's tail for a local command: complete the turn, then record it as a local turn
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts - the reference's local turns: record, anchor, interleave, resolve and delete
---

## Goal

A person's `!` command runs in a terminal that the host opens, and its turn is a turn of the chat.
No agent sees that turn, so no agent's transcript holds it.
After a restart the host reads a chat back from its transcript, and the `!` turn is not there.
The reference host keeps such a turn as a local turn, and puts it back after the turn that it followed.
With this plan, the host keeps each `!` turn as a local turn of its chat.
Every read of a transcript puts the turn back in its place.
A truncation or a fork at a local turn cuts the agent's conversation at the turn before it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, and the refs of each child plan.

### Searches performed

- `rg -n "transcript\?\.\(|\.transcript\(" packages/sdk/src/host` - five reads of a transcript: `past`, two in a wake, a chat's snapshot and a retained terminal's rebuild.
- `rg -n "commandTurns" packages/sdk/src` - the host knows a `!` turn from its start to its end.
- `rg -n "onTurnRecorded" packages` - only agent-claude names a turn's transcript id, and the host copies a sender to it.
- On SDK 0.3.301 the CLI echoes no streamed prompt, and agent-claude names a turn's transcript id from that echo, so it never does.
  A prompt sent with a `uuid` is written to the transcript under that uuid.
- On SDK 0.3.301 a Claude fork made with `resume`, `forkSession` and `resumeSessionAt` keeps the source's message uuids.
- `rg -n "id: message.id|const turnId = entry.id|crypto.randomUUID" packages/agent-*/src` - cofold and pi read a turn back under the id of the prompt that they stored, and ACP under a new UUID.
- `rg -n "ran:|const ran" packages/agent-*/src` - every backend builds a `!` turn in memory and writes it to no store of its own.

### Runtime path

```
!command -> lifecycle beginOrRun -> Session.ran -> the turn ends -> the host keeps a local turn in the session's folder
restart -> a transcript read -> each local turn goes back after its anchor -> seed or snapshot -> what a client reads
```

### Gaps

- A `!` turn is lost when the daemon starts again, in every backend.
- The retained terminal of a `!` call cannot be rebuilt after a restart, because no turn names it.
- A truncation or a fork at a `!` turn is refused, because the backend has no end point for it.
- A cofold turn, a pi turn and a Claude turn are read back under another id than the client's.
  Nothing tells the host that id.
- An ACP chat read back after a restart is its server's replay, and every load names its turns with new UUIDs.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The host keeps a `!` turn as a local turn of its chat when the turn ends. No agent sees a local turn. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/localCommands/localChatCommand.ts#L201-L245 | p1 |
| Each local turn names its anchor: the nearest turn before it that is not a local turn, by the id that the backend's transcript gives that turn. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L100-L109; [code://packages/sdk/src/types/agent.ts#L517-L530](../../../../packages/sdk/src/types/agent.ts#L517-L530) | p1 |
| Every read of a transcript puts the local turns back: the ones with no anchor first, then each after its anchor in the order kept. One whose anchor is gone is dropped. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L202-L234 | p1 |
| A truncation or a fork at a local turn goes to the backend at the turn before it. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentSideEffects.ts#L1954-L1982; https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentService.ts#L7183-L7195 | p1 |
| A cofold turn stores its prompt under the id that the client gave the turn. | npm://@cofold/agents@0.4.0 - `RunArgs.messageId`: "A client that supplies it can match run.started to its send" | p2 |
| A pi turn names the entry of its prompt through `onTurnRecorded`. | [code://packages/sdk/src/types/agent.ts#L517-L530](../../../../packages/sdk/src/types/agent.ts#L517-L530); [code://packages/agent-pi/src/replay.ts#L127-L130](../../../../packages/agent-pi/src/replay.ts#L127-L130) | p3 |
| A Claude turn writes its prompt under the turn's id when it is a UUID, and otherwise under a uuid that it names through `onTurnRecorded`. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgentSession.ts#L1294-L1298 | p4 |
| A local turn copied into a Claude fork keeps its anchor, because the fork keeps the source's message uuids. | npm://@anthropic-ai/claude-agent-sdk@0.3.301, measured | p1 |
| A local turn after an ACP turn is dropped after a restart, as the reference drops a local turn whose anchor is gone. A local turn before every ACP turn comes back. | https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L221; [code://packages/agent-acp/src/transcript.ts#L110-L120](../../../../packages/agent-acp/src/transcript.ts#L110-L120) | - |

## Proposed architecture

- **Data flow** - a local turn goes to the session's folder at its end, and back at each transcript read.
- **Event flow** - no new action: a local turn reaches a client in a snapshot, as the other turns of a chat read back do.
- **State flow** - a backend that resumes takes the local turns in its seed, so its chat holds them as it holds the turns before them.
- **Layer responsibilities** - `@ahpd/sdk`: the local turns, their anchors and every read; agent-cofold and agent-pi: a turn read back under a name that the host knows.
- **Source-of-truth files** - `packages/sdk/src/host/localturns.ts`, which p1 creates.

## Tasks

| Plan | Status | Depends on |
| --- | --- | --- |
| [p1 - The host keeps a command's turn for its chat](../130-p1-the-host-keeps-a-commands-turn/plan.md) | built 2026-10-27 | - |
| [p2 - A cofold turn keeps the id it was given](../130-p2-a-cofold-turn-keeps-its-id/plan.md) | built 2026-10-27 | - |
| [p3 - A pi turn names the entry that holds it](../130-p3-a-pi-turn-names-its-entry/plan.md) | built 2026-10-27 | - |
| [p4 - A Claude turn is written under its id](../130-p4-a-claude-turn-is-written-under-its-id/plan.md) | built 2026-10-28 | - |

## Risks and tradeoffs

- A turn that never reaches the transcript anchors nothing after a restart - the local turn after it is dropped as an orphan.

## Resume state

- **Done so far:** p1 to p3 planned and built 2026-10-27, and p4 2026-10-28; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a backend's turn id and its transcript's id are two names for one turn, and only the transcript's survives a restart.

## Final verification checklist

- [x] Each case fails on the code before this plan.
- [x] `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass, and so do the suites of the packages this plan changes.
- [x] `plans/index.md` updated.
