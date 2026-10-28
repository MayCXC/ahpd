---
title: A refused login hands the turn on
status: todo
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
6. Leave the synthetic reply of a turn that moves out of its parts.
7. On that turn's `result`, pick the next login that it has not tried and that is not cooling down.
8. Start a new CLI on that login, resumed at the cut point.
9. Send the turn's prompt again with its attachments, under `writtenAs(turnId, true)`.
10. When no login remains, show until when the turn waits.
11. Try again when the earliest cooldown ends.
12. End the wait and the move in `cancel`.
13. Write the `logins` field and the refusal into the README, and the scenario into the spec.

## Validation

- `packages/agent-claude/test/agent-claude-logins.test.ts` holds these cases:
  - A refusal before the turn shows anything completes the turn on the next login.
  - That turn resumes at the previous turn's end, and sends its prompt once more.
  - That turn never shows the synthetic reply.
  - A refusal after the turn shows a part fails the turn, and the next turn starts on the next login.
  - A refusal on a conversation's first turn fails the turn.
  - With every login cooling down, the turn waits, and then runs on the earliest.
  - A cancel during the wait ends the turn and starts no CLI.
  - `authentication_failed` fails the turn and moves nothing.
  - A `billing_error` cools a login down for 10 minutes.
- Run `pnpm vitest run packages/agent-claude --maxWorkers=1` and `pnpm vitest run packages/sdk --maxWorkers=1`, and expect them to pass.
- Run the new cases on the code before this task, and expect them to fail.
- Run `lint-prose.mjs` on the README section and the spec scenario, and expect no finding.

## Resume

