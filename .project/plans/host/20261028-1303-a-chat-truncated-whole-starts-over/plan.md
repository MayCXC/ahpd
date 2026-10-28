---
title: A chat truncated whole starts over
domain: host
status: active
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
changes:
  - specs/sessions-and-chats.md
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1468-L1567](../../../../packages/sdk/src/host/chatactions.ts#L1468-L1567) - `chat/truncated`: the rewind, and the two refusals of a cut before every turn the backend saw"
  - "[code://packages/sdk/src/host/chatactions.ts#L895-L958](../../../../packages/sdk/src/host/chatactions.ts#L895-L958) - a restart held in `restarting`, so the actions behind it wait for it"
  - "[code://packages/sdk/src/host/chatactions.ts#L323-L331](../../../../packages/sdk/src/host/chatactions.ts#L323-L331) - an action waits while its session restarts"
  - "[code://packages/sdk/src/host/lifecycle.ts#L451-L500](../../../../packages/sdk/src/host/lifecycle.ts#L451-L500) - `deleted` and `deletedChat`, the backend's copy of a chat's conversation gone"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1440-L1459](../../../../packages/sdk/src/host/sessionmethods.ts#L1440-L1459) - a closed chat's backend id, read before the chat goes, and its conversation deleted"
  - "[code://packages/sdk/src/types/agent.ts#L790-L823](../../../../packages/sdk/src/types/agent.ts#L790-L823) - `Agent.delete`, called after the backend has stopped"
  - "[code://packages/agent-claude/src/claude.ts#L533-L534](../../../../packages/agent-claude/src/claude.ts#L533-L534) - the Claude backend deletes with the SDK's `deleteSession`"
  - "[code://packages/agent-claude/src/claude.ts#L612-L616](../../../../packages/agent-claude/src/claude.ts#L612-L616) - a start with no resume names a new conversation with the chat's own id"
  - "[code://packages/sdk/test/support/claude-sdk.ts](../../../../packages/sdk/test/support/claude-sdk.ts) - the fake SDK the host cases drive the Claude backend through"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `deleteSession` removes a session's transcript and its subagent folder (sdk.d.ts L670-L688)
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgent.ts#L1104-L1168 - the reference's `truncateChat`, and `_removeAllTurns` for a truncation with no turn
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentSideEffects.ts#L1954-L1992 - a local turn's truncation goes to its anchor, and to no turn when it has none
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts - `resolveConcreteTurnId`, a local turn's anchor, or nothing before every concrete turn
---

## Goal

AHP's `chat/truncated` with no `turnId` clears a chat's whole conversation.
The host refuses it today, because a rewind needs an entry before the first prompt, and the agent would remember everything the screen dropped.
A backend that can delete its conversation gives a third answer: the conversation starts over.
The backend stops, deletes the conversation, and begins a new one under the chat's own name, so the agent forgets what the clients dropped.
A truncation at a `!` command's turn with no turn of the backend before it is the same cut, and starts over too.
A backend that cannot delete keeps the refusal.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "not a conversation entire" packages docs` - the refusal in two places of `chatactions.ts`, two host cases, and the protocol cases' list of refusals.
- `rg -n "deletedChat" packages/sdk/src` - the host deletes one chat's conversation when a closed chat is deleted.
- The reference starts over in four steps:
  - it stops the live query;
  - it deletes the transcript through the SDK;
  - it makes a fresh session for the same chat and the same SDK id;
  - it drops the chat's stored turns.
- The reference sends a local turn's truncation to the turn before it, and with no such turn it truncates with no turn.
- The protocol cases 066, 068 and 234 truncate with no turn, and the host refuses all three today.

### Runtime path

```
chat/truncated with no turnId -> the chat's backend has `delete`
  -> the chat's backend stops -> `deletedChat` -> the action is said
  -> the dropped turns' outputs and local turns go -> spawn with no resume, seeded with the kept turns
```

### Gaps

- Nothing starts a chat's conversation over.
- The fake SDK has no `deleteSession`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A truncation with no `turnId` starts the chat over when the chat's backend has `delete`. | Aaron, 2026-10-28: "seems like conversations should just have a zero point before any turns to fall back to in that case?"; the reference's `_removeAllTurns` | 01 |
| A truncation at a local turn with no turn of the backend before it starts the chat over too, and the chat keeps the turns up to the local turn. | The reference's `resolveConcreteTurnId`, which gives no turn, and its `truncateChat` with no turn | 01 |
| A backend with no `delete` is refused with today's words, because nothing else makes it forget the conversation. | [code://packages/sdk/src/host/chatactions.ts#L1486-L1498](../../../../packages/sdk/src/host/chatactions.ts#L1486-L1498) | 01 |
| The chat's backend stops before its conversation is deleted, and the delete names the backend's own id for the chat. | [code://packages/sdk/src/types/agent.ts#L790-L823](../../../../packages/sdk/src/types/agent.ts#L790-L823); [code://packages/sdk/src/host/sessionmethods.ts#L1440-L1459](../../../../packages/sdk/src/host/sessionmethods.ts#L1440-L1459) | 01 |
| The action is said after the delete, before the new backend starts, so a failed delete refuses an action that no client has applied. | [code://packages/sdk/src/host/chatactions.ts#L1528-L1537](../../../../packages/sdk/src/host/chatactions.ts#L1528-L1537), said before the restart | 01 |
| A delete that fails starts the chat again on the conversation it had, and the action is refused with the reason. | [code://packages/sdk/src/host/lifecycle.ts#L451-L500](../../../../packages/sdk/src/host/lifecycle.ts#L451-L500), which returns the failure | 01 |
| The new backend starts with no resume, under the chat's own name, seeded with the kept turns, as the rewind starts its own. | [code://packages/sdk/src/host/chatactions.ts#L1552-L1563](../../../../packages/sdk/src/host/chatactions.ts#L1552-L1563); the reference's fresh session for the same chat and id | 01 |
| The dropped turns' terminal outputs and local turns go, as a rewind drops them. | [code://packages/sdk/src/host/chatactions.ts#L1538-L1545](../../../../packages/sdk/src/host/chatactions.ts#L1538-L1545) | 01 |
| The start-over is held in `restarting`, so an action behind it waits for the new backend. | [code://packages/sdk/src/host/chatactions.ts#L895-L958](../../../../packages/sdk/src/host/chatactions.ts#L895-L958) | 01 |
| The protocol cases 066, 068 and 234 run through the host and leave the refusal lists. | [code://packages/sdk/test/ahp-test-cases.test.ts#L510-L513](../../../../packages/sdk/test/ahp-test-cases.test.ts#L510-L513) | 01 |
| The fake SDK deletes a conversation as the SDK documents: the file and the session go, and a session it does not hold throws. | npm://@anthropic-ai/claude-agent-sdk@0.3.301, sdk.d.ts L670-L688 | 01 |

## Proposed architecture

- **Data flow** - the chat's backend id -> `Agent.delete` -> a `Start` with no resume and the kept turns as its seed.
- **Event flow** - `chat/truncated` reaches every client after the delete and before the new backend's snapshot.
- **State flow** - the chat keeps its URI and its name; the backend's conversation is new.
- **Layer responsibilities** - packages/sdk: the action and the order of its steps · each backend: its own `delete`, and a start with no resume.
- **Source-of-truth files** - [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the-host-starts-a-chat-over](task-01-the-host-starts-a-chat-over.md) | todo | - |
| [02 - the-spec-and-docs-say-so](task-02-the-spec-and-docs-say-so.md) | todo | 01 |

## Risks and tradeoffs

- A start-over cannot be undone - the action asks for it, and the reference deletes the transcript the same way.
- After a start-over, a daemon that restarts before the first prompt finds no transcript - a chat nobody spoke to is in that state too.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-host-starts-a-chat-over.md](task-01-the-host-starts-a-chat-over.md).
- **Open questions:** none.
- **Watch out for:** the delete must wait for the old backend to stop, or the CLI writes the transcript again behind it.

## Final verification checklist

- [ ] Each new case fails before task 01 and passes after it.
- [ ] `pnpm boundary`, `pnpm typecheck`, `pnpm build` and `pnpm schema` pass.
- [ ] The sdk and agent-claude suites pass at one worker.
- [ ] The spec and the docs say what a truncation with no turn does.
