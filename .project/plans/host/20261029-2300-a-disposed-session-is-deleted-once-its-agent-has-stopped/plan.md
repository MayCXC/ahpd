---
title: A disposed session is deleted once its agent has stopped
domain: host
status: built
priority: high
created: 2026-10-29
revalidated: 2026-10-29
refs:
  - git://c26f1e96 - the commit of `main` the facts were checked at
  - "[code://packages/sdk/src/host/lifecycle.ts#L238-L256](../../../../packages/sdk/src/host/lifecycle.ts#L238-L256) - `teardown` closes each chat, and `removeSession` asks the backend for its copy once this is done"
  - "[code://packages/sdk/src/host/lifecycle.ts#L631-L633](../../../../packages/sdk/src/host/lifecycle.ts#L631-L633) - `removeSession` deletes the backend's copy right after the teardown"
  - "[code://packages/sdk/src/types/session.ts#L810-L824](../../../../packages/sdk/src/types/session.ts#L810-L824) - `close` answers a promise that settles when the agent's process has gone"
  - "[code://packages/agent-claude/src/session.ts#L279-L321](../../../../packages/agent-claude/src/session.ts#L279-L321) - Claude's `close` settles once the CLI's process has exited"
  - "[code://packages/sdk/src/host/lifecycle.ts#L801](../../../../packages/sdk/src/host/lifecycle.ts#L801) - a respawn waits for the chats' closes before the next agent starts"
  - "[code://packages/sdk/src/host/chatactions.ts#L1518](../../../../packages/sdk/src/host/chatactions.ts#L1518) - a start-over waits for the close before it deletes the conversation"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgent.ts#L1141-L1168 - the reference shuts the live query down before it deletes the transcript
---

## Goal

A disposed session leaves no copy of its conversation behind.
The host asks the backend to delete its copy only after every chat's agent has stopped.
What an agent writes as it exits is then deleted with the rest.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "teardown\(" packages/sdk/src` - `removeSession` is the one caller.
- `rg -n "close\('stopping'\)|close\('dispose'\)" packages/sdk/src/host` - a respawn and a start-over wait for the close, and a disposal does not.
- On one daemon, three sessions were each created and disposed within 300 ms.
  Each left a Claude transcript of three lines: `last-prompt`, `atis-latch` and `cost-state`.
  Each CLI exited 3 ms after the host logged the disposal, and its exit wrote those lines.
  The host listed the transcripts again, and a client that resumed one failed.

### Runtime path

```
disposeSession -> teardown -> chat.close('dispose'), not waited -> deleted -> transcript removed
CLI exits 3 ms later -> writes its last lines -> the transcript is back
```

### Gaps

- `removeSession` deletes the backend's copy before the agents it closed have stopped.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `teardown` answers once every chat's close has settled | The `close` contract, and the respawn's wait | 01 |
| `removeSession` waits for it before it asks for the backend's copy | The start-over, and the reference's shutdown before its delete | 01 |
| A close that fails does not hold the delete back | A sleep's close, which catches each one | 01 |

## Proposed architecture

- **Data flow** - unchanged.
- **Event flow** - `teardown` answers a promise of the chats' closes, and `removeSession` awaits it before `deleted`.
- **Layer responsibilities** - sdk: `host/lifecycle.ts`.
- **Source-of-truth files** - [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The copy is deleted after the agents stop](task-01-the-copy-is-deleted-after-the-agents-stop.md) | done | - |

## Risks and tradeoffs

- A disposal ends as late as the slowest agent's exit, which the backend bounds, as a respawn does.

## Resume state

- **Done so far:** planned and built 2026-10-29. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a backend whose close answers nothing is waited for no longer than before.

## Final verification checklist

- [x] What an agent writes as it exits is deleted with the session's copy.
- [x] Every other case in `session-delete.test.ts` passes.
