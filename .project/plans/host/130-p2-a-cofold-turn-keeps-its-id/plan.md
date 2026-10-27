---
title: A cofold turn keeps the id it was given
domain: host
status: planned
priority: medium
created: 2026-10-27
revalidated: 2026-10-27
refs:
  - "[code://packages/agent-cofold/src/turns.ts#L219-L235](../../../../packages/agent-cofold/src/turns.ts#L219-L235) - `launch`, which starts a cofold run with no `messageId`"
  - "[code://packages/agent-cofold/src/transcript.ts#L317-L326](../../../../packages/agent-cofold/src/transcript.ts#L317-L326) - a turn read back is named by the message that opens it"
  - npm://@cofold/agents@0.4.0 - `RunArgs.messageId`: "The input message's id; default newId(). A client that supplies it can match run.started to its send. Must be new in the session"
---

## Goal

A cofold turn stores its prompt under a new id that cofold makes.
A turn read back from cofold's store is named by that id, and not by the id that the client gave the turn.
So a local turn's anchor, written by the client's id, is not found after a restart.
With this plan, a cofold turn stores its prompt under the turn's own id, so the turn has one name before and after a restart.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "messageId" packages/agent-cofold/node_modules/@cofold/agents/dist/run/run.js` - a given id is the input message's id, and an id the session holds already is refused with `already_exists`.
- `rg -n "onTurnRecorded" packages/agent-cofold/src` - agent-cofold names no transcript id.

### Runtime path

```
beginTurn(turnId) -> launch -> run({ messageId: turnId }) -> cofold stores the prompt as turnId -> a restart reads the turn as turnId
```

### Gaps

- A cofold turn is read back under another id than the client's.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `launch` passes the turn's id to `run` as `messageId`. | npm://@cofold/agents@0.4.0 - `RunArgs.messageId` | 01 |
| A turn id that the session holds already fails that turn with cofold's own error, as any other start failure does. | npm://@cofold/agents@0.4.0 - `run` refuses an id the session holds with `already_exists`; [code://packages/agent-cofold/src/turns.ts#L229-L232](../../../../packages/agent-cofold/src/turns.ts#L229-L232) | 01 |

## Proposed architecture

- **Data flow** - the client's turn id goes into cofold's store as the prompt's id.
- **Event flow** - unchanged.
- **State flow** - a turn has the same id live and read back.
- **Layer responsibilities** - agent-cofold only.
- **Source-of-truth files** - [`code://packages/agent-cofold/src/turns.ts`](../../../../packages/agent-cofold/src/turns.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A cofold prompt is stored under its turn's id](task-01-a-cofold-prompt-is-stored-under-its-turns-id.md) | todo | - |

## Risks and tradeoffs

- cofold reads the session's messages once more when a run is given an id - a turn reads that history to prompt the model anyway.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-cofold-prompt-is-stored-under-its-turns-id.md](task-01-a-cofold-prompt-is-stored-under-its-turns-id.md).
- **Open questions:** none.
- **Watch out for:** a run that resumes a paused turn keeps the run it had, and takes no new id.

## Final verification checklist

- [ ] The case fails on the code before this plan.
- [ ] The agent-cofold suite passes.
- [ ] `plans/index.md` updated.
