---
title: A refused login hands the turn on
status: done
depends: [task-01-a-conversation-runs-on-its-own-login.md]
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L605-L870](../../../../packages/agent-claude/src/session/query.ts#L605-L870) - `consume`, which reads each frame of the CLI and ends a turn on its `result`"
  - "[code://packages/agent-claude/src/session/query.ts#L482-L511](../../../../packages/agent-claude/src/session/query.ts#L482-L511) - which conversation a query carries, and a rewind's `resumeSessionAt`"
  - "[code://packages/agent-claude/src/session/turns.ts#L63-L92](../../../../packages/agent-claude/src/session/turns.ts#L63-L92) - `push` and `writtenAs`, how a prompt goes out"
  - "[code://packages/agent-claude/src/session/turns.ts#L661-L721](../../../../packages/agent-claude/src/session/turns.ts#L661-L721) - `cancel`"
  - "[code://packages/agent-claude/README.md#L54-L81](../../../../packages/agent-claude/README.md#L54-L81) - the fields of a record"
---

## Objective

A login that the API refuses for its quota or its billing cools down for every session of the agent.
A turn that showed nothing before the refusal runs again on the next login.
When every login cools down, the turn waits for the earliest one.

## Files

- `UPDATE: packages/agent-claude/src/logins.ts` - the cooldown a refusal gives, from the event's reset and window.
- `UPDATE: packages/agent-claude/src/session/logins.ts` - the refusal, the move to the next login, the wait, and the stop of the wait.
- `UPDATE: packages/agent-claude/src/session/query.ts:605-870` - `rate_limit_event`, the refused `assistant` frame and its `result` reach the area.
- `UPDATE: packages/agent-claude/src/session/query.ts:482-511` - a query that is not the first may resume at a cut point.
- `UPDATE: packages/agent-claude/src/session/turns.ts:63-92` - the running turn's prompt kept as it went out, and sent again under a new uuid.
- `UPDATE: packages/agent-claude/src/session/turns.ts:661-721` - `cancel` ends a wait.
- `UPDATE: packages/agent-claude/README.md:54-81` - the `logins` field, and what a refusal does.
- `UPDATE: .project/specs/agent-backends.md:75-95` - the scenario of a refused login.
- `UPDATE: packages/agent-claude/test/agent-claude-logins.test.ts` - the cases below.

## Steps

1. Write `cooldownUntil(refusal, now)` in `logins.ts` from meridian's caps, its 10-minute default and its `toEpochMs`, and cite them.
2. Keep a `rejected` event's reset and window in the area until the turn's `assistant` frame arrives.
3. Mark the session's login on an `assistant` frame of the lead conversation whose `error` is `rate_limit` or `billing_error`.
4. Move a refused turn only when it has no response part yet.
5. Move it only when the last turn before it that ran on the CLI has an entry in `ends`.
6. With no turn before it, move a conversation this process started on this host by starting it over.
7. Leave the synthetic reply of a turn that moves out of its parts.
8. On that turn's `result`, pick the next login that it has not tried and that is not cooling down.
9. Start a new CLI on that login, resumed at the cut point.
10. For a start-over, wait for the old CLI to stop, then delete the conversation.
11. Mark the CLI that a move closes, so that its end does not stop the session.
12. Start the new CLI of a start-over with no resume.
13. When the delete fails, resume the conversation as it is, and fail the turn with the refusal.
14. Send the turn's prompt again with its attachments, under `writtenAs(turnId, true)`.
15. When no login remains, show until when the turn waits.
16. Try again when the earliest cooldown ends, on that login if no other login is back.
17. End the wait and the move in `cancel` and in the session's `close`.
18. Write the `logins` field and the refusal into the README, and the scenario into the spec.

## Validation

- `packages/agent-claude/test/agent-claude-logins.test.ts` holds these cases:
  - A refusal before the turn shows anything completes the turn on the next login.
  - That turn resumes at the previous turn's end, and sends its prompt once more.
  - That turn never shows the synthetic reply.
  - A refusal after the turn shows a part fails the turn, and the next turn starts on the next login.
  - A refusal on a conversation's first turn starts it over under its id.
  - A start-over goes on when the CLI that it stops raises as it ends.
  - A conversation that started over runs its next turn.
  - A conversation that the start-over cannot delete comes back as it was, and the turn fails with the refusal.
  - A refusal after a turn read back from a transcript fails the turn, and starts nothing over.
  - With every login cooling down, the turn waits, and then runs on the earliest.
  - A cancel during the wait ends the turn and starts no CLI.
  - A session closed during the wait starts no CLI.
  - `authentication_failed` fails the turn and moves nothing.
  - A `billing_error` cools a login down for 10 minutes.
- Run `pnpm vitest run packages/agent-claude --maxWorkers=1` and `pnpm vitest run packages/sdk --maxWorkers=1`, and expect them to pass.
- Run the new cases on the code before this task, and expect them to fail.
- Run `lint-prose.mjs` on the README section and the spec scenario, and expect no finding.

## Resume

Done 2026-10-28, on the branch of [A chat truncated whole starts over](../../host/20261028-1303-a-chat-truncated-whole-starts-over/plan.md).
Ten of the twelve refusal cases fail on task 01's code.
The case of a refused sign-in passes there too, because it keeps today's behaviour.
The case of a session closed during a wait passes there, because nothing waits.
It fails on this task's code without the stop in `close`.
The SDK's `close` ends the frames at once, and its dispose waits up to 2 seconds for the CLI to exit.
So the CLI that a start-over stops ends before the next CLI exists.
An end that marks the session gone fails the next turn with `The agent stopped`.
A CLI that raises as it ends fails the refused turn with the raise.
The mark of the CLI that a move closed keeps both ends quiet.
A timer can fire before the clock passes its deadline: 51 of 200 Node timers did.
So a wait tries the login it waited for, and not the first login of the order.

