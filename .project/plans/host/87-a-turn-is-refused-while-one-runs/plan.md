---
title: A turn is refused while one runs
domain: host
status: active
priority: high
created: 2026-10-14
revalidated: 2026-10-14
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L984-L1050](../../../../packages/sdk/src/host/lifecycle.ts#L984-L1050) - `beginOrRun`, the one road a turn takes to a backend, with no check for a running turn"
  - "[code://packages/agent-claude/src/session/turns.ts#L194-L206](../../../../packages/agent-claude/src/session/turns.ts#L194-L206) - `beginTurn`, which replaces `ctx.active` and loses the running turn"
  - "[code://packages/agent-claude/src/session/turns.ts#L448](../../../../packages/agent-claude/src/session/turns.ts#L448) - `ran`, which already checks `busy()`, the pattern to mirror"
  - "[code://packages/sdk/src/host/wakes.ts#L89-L90](../../../../packages/sdk/src/host/wakes.ts#L89-L90) - how the host reads a busy chat from `chatState()`"
  - "[code://packages/sdk/src/host/chatactions.ts#L1056-L1068](../../../../packages/sdk/src/host/chatactions.ts#L1056-L1068) - the refusal of a steering message with nothing to steer, the pattern for the sentence"
  - "npm://@microsoft/agent-host-protocol@1.0.0 - the chat reducer sets `activeTurn` on `chat/turnStarted` and keeps nothing of the turn before"
---

## Goal

A client that starts a turn while another runs gets a refusal, and the running turn stays in every client's history.
Today the host accepts it, and the record of the running turn is lost.
Found 2026-10-14 on a build session: a second `ahpc prompt` erased turn 1 from the history, and the new turn carried turn 1's usage.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "begin\(" packages/sdk/src packages/agent-*/src` - `beginOrRun` in `lifecycle.ts`, automations, wakes and tooling. Wakes and tooling check `activeTurn` first.
- `rg "busy\(\)" packages/agent-claude/src/session/turns.ts` - `ran`, `resume` and the queue check it; `beginTurn` does not.

### Runtime path

```
client chat/turnStarted -> lifecycle.ts beginOrRun -> session.begin -> beginTurn -> ctx.active replaced -> turn 1 never reaches ctx.turns
```

### Gaps

- `beginOrRun` sends a client turn to the backend when `chatState().activeTurn` is set.
- `beginTurn` in agent-claude has no `busy()` check. The acp, cofold and pi backends are not checked yet.
- No test starts a turn on a busy session.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| The host refuses `chat/turnStarted` with no `queuedMessageId` while the chat has an active turn, with "A turn is running in this chat" | Softov, 2026-10-14, chose "Refuse the action" for "When a client sends chat/turnStarted while a turn is running, what should ahpd do?" | 01 |
| Each backend's `begin` refuses while a turn runs, so that no caller of `begin` can drop a turn | Softov, 2026-10-14, same answer | 01 |

## Proposed architecture

- **Data flow** - `beginOrRun` reads `chatState()` before it calls `begin`. A busy chat returns the refusal, which the caller already sends as a rejected action.
- **Event flow** - the client gets the rejection and rolls back its optimistic `chat/turnStarted`. Nothing reaches the other clients.
- **Layer responsibilities** - sdk: the check in `beginOrRun` · agent-claude, agent-acp, agent-cofold, agent-pi: a refusal in `begin` while busy.
- **Source-of-truth files** - [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A turn started on a busy chat is refused](task-01-a-turn-started-on-a-busy-chat-is-refused.md) | implemented | - |

## Risks and tradeoffs

- A queued message starts its turn through the same road, after the running turn ends. The check must apply only when `queuedAs` is undefined, or the queue stops.
- An automation that starts a turn on a busy chat now gets a refusal. Automations already wait for an idle chat, so this must change nothing. A test proves it.

## Resume state

- **Done so far:** task 01 implemented 2026-10-14, not reviewed and not set to done. The host refuses a turn on a busy chat, and agent-claude drops one that still reaches `begin`. agent-acp, agent-cofold and agent-pi needed no change.
- **Next action:** review task 01, then the *Final verification checklist* by hand.
- **Open questions:** none.
- **Watch out for:** a turn whose model switch is still in progress is busy through `ctx.beginning`, not `ctx.active`. Count it as busy. A message that waited its turn and a `!command` are exempt from the host's check, so the queue keeps moving.

## Final verification checklist

- [ ] A test: a client `chat/turnStarted` on a busy chat is rejected, and the running turn is unchanged.
- [ ] A test: a queued message still starts its turn when the running one ends.
- [ ] A test per backend: `begin` while busy leaves the running turn in place.
- [ ] The gates pass: typecheck, boundary, schema and vitest.
- [ ] `plans/index.md` updated.
