---
title: A pi turn names the entry that holds it
domain: host
status: planned
priority: medium
created: 2026-10-27
revalidated: 2026-10-27
refs:
  - "[code://packages/agent-pi/src/replay.ts#L127-L130](../../../../packages/agent-pi/src/replay.ts#L127-L130) - a turn read back from pi's file is named by its prompt's entry id"
  - "[code://packages/agent-pi/src/session.ts#L1071-L1072](../../../../packages/agent-pi/src/session.ts#L1071-L1072) - a turn sends its prompt"
  - "[code://packages/agent-pi/src/session.ts#L766-L773](../../../../packages/agent-pi/src/session.ts#L766-L773) - at `agent_settled`, a turn records the entry that it ended on"
  - "[code://packages/agent-pi/src/backend.ts#L338](../../../../packages/agent-pi/src/backend.ts#L338) - `leaf`, the backend's read of pi's current entry"
  - "[code://packages/sdk/src/types/agent.ts#L517-L530](../../../../packages/sdk/src/types/agent.ts#L517-L530) - `onTurnRecorded`, the port for a turn written under an id of its own"
  - "[code://packages/agent-claude/src/session/query.ts#L773-L788](../../../../packages/agent-claude/src/session/query.ts#L773-L788) - agent-claude's call, from the turn's first prompt and not after"
  - npm://@earendil-works/pi-coding-agent@1.3.0 - `SessionManager.getBranch`, the entries from the root to the leaf; `AgentSession` writes a message's entry after its listeners hear `message_end`
---

## Goal

pi writes a turn's prompt to its session file as an entry with an id of pi's own.
A turn read back from that file is named by that entry's id, and not by the id that the client gave the turn.
Nothing tells the host that id, so a local turn's anchor is not found after a restart.
With this plan, a pi turn names its prompt's entry through `onTurnRecorded` when the turn settles.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "onTurnRecorded" packages/agent-pi/src` - agent-pi does not call it.
- `rg -n "appendMessage" packages/agent-pi/node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js` - pi writes a message's entry after it tells its listeners of `message_end`, so the entry is there by `agent_settled`.
- `rg -n "getBranch|getLeafId" packages/agent-pi/node_modules/@earendil-works/pi-coding-agent/dist/core/session-manager.d.ts` - the manager reads the path to the leaf, and the leaf.

### Runtime path

```
begin -> leaf before the prompt -> prompt -> agent_settled -> the first user entry after that leaf -> onTurnRecorded(turnId, entry id)
```

### Gaps

- A pi turn is read back under another id than the client's, and the host is not told it.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A pi turn calls `onTurnRecorded(turnId, entryId)` when the two ids differ. | [code://packages/sdk/src/types/agent.ts#L517-L530](../../../../packages/sdk/src/types/agent.ts#L517-L530) | 01 |
| The entry is the first user message on pi's branch after the leaf that the turn began on, which is the entry `replay.ts` names the turn by. | [code://packages/agent-pi/src/replay.ts#L127-L130](../../../../packages/agent-pi/src/replay.ts#L127-L130) | 01 |
| The turn's first prompt names it, and a message that steers it later does not, as agent-claude takes the turn's first echo. | [code://packages/agent-claude/src/session/query.ts#L773-L788](../../../../packages/agent-claude/src/session/query.ts#L773-L788) | 01 |
| The call is made at `agent_settled`, beside the entry that the turn ended on, because pi writes the prompt's entry after it tells its listeners. | npm://@earendil-works/pi-coding-agent@1.3.0 - `AgentSession` at `message_end`; [code://packages/agent-pi/src/session.ts#L766-L773](../../../../packages/agent-pi/src/session.ts#L766-L773) | 01 |
| The backend port gains `promptAfter(entryId)`, which reads `SessionManager.getBranch`. | [code://packages/agent-pi/src/backend.ts#L338](../../../../packages/agent-pi/src/backend.ts#L338) | 01 |

## Proposed architecture

- **Data flow** - the leaf before a prompt, then pi's branch at the turn's end, give the prompt's entry id to the host.
- **Event flow** - unchanged for clients.
- **State flow** - the host holds the turn's transcript id, which p1 uses as an anchor.
- **Layer responsibilities** - agent-pi only.
- **Source-of-truth files** - [`code://packages/agent-pi/src/session.ts`](../../../../packages/agent-pi/src/session.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A pi turn says its prompt's entry](task-01-a-pi-turn-says-its-prompts-entry.md) | todo | - |

## Risks and tradeoffs

- pi reads a steered turn back as two turns - a local turn after it goes after the first one.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-pi-turn-says-its-prompts-entry.md](task-01-a-pi-turn-says-its-prompts-entry.md).
- **Open questions:** none.
- **Watch out for:** pi writes the prompt's entry after its listeners hear `message_end`, so the leaf at that event is the entry before the prompt.

## Final verification checklist

- [ ] The case fails on the code before this plan.
- [ ] The agent-pi suite passes.
- [ ] `plans/index.md` updated.
