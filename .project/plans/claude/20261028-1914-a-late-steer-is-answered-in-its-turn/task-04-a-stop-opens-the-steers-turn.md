---
title: A stop opens the turn that answers its steering messages
status: done
depends: [task-03-the-read-back-folds-a-steer.md]
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/turns.ts#L728-L790](../../../../packages/agent-claude/src/session/turns.ts#L728-L790) - `cancel`, which ends the turn"
  - "[code://packages/agent-claude/src/session/query.ts#L673-L696](../../../../packages/agent-claude/src/session/query.ts#L673-L696) - which prompt the CLI is answering, and whose turn the answer is"
  - "[code://packages/agent-claude/src/session/query.ts#L820-L970](../../../../packages/agent-claude/src/session/query.ts#L820-L970) - the result branch, which ends a turn"
---

## Objective

A turn begun after a stop gets only its own answer.
A steering message the CLI still holds at the stop is answered in a turn of its own, which opens as the stopped turn ends.
That turn is the chat's active turn, so a new turn waits for it as for any other.
A stopped turn's result ends no other turn.

## Files

- `UPDATE: packages/agent-claude/src/session/context.ts` - each owed prompt says which turn it belongs to and whether the CLI holds it.
- `UPDATE: packages/agent-claude/src/session.ts` - the map's entry type.
- `UPDATE: packages/agent-claude/src/session/turns.ts` - `push` records the turn; `cancel` hands the steering messages the CLI holds to their own turn.
- `UPDATE: packages/agent-claude/src/session/query.ts` - frames and results go to the turn their prompts belong to; `command_lifecycle` frames are read; a failed result hands over too.
- `UPDATE: packages/agent-claude/src/session/parts.ts` - a turn opened for a steering message names it in `queuedMessageId`.
- `UPDATE: packages/agent-claude/test/agent-claude-late-steer.test.ts` - the stop cases, and a failure with a steering message queued.
- `CREATE: packages/agent-claude/test/fixtures/claude-folded-stop.jsonl` - a stop after the CLI folded a steering message in.
- `CREATE: packages/agent-claude/test/fixtures/claude-failed-steer.jsonl` - a turn that fails at its turn limit with a steering message queued, and that message's answer.
- `CREATE: packages/agent-claude/test/fixtures/claude-stopped-turn.jsonl` - a stop with nothing queued, and a new prompt sent at once.
- `CREATE: packages/agent-claude/test/fixtures/claude-failed-steer-transcript.jsonl` - what the SDK's reader returns for the session of the failure capture.
- `UPDATE: packages/sdk/test/host-local-turns.test.ts` - the failure capture through a host, read back by another on the same store.
- `UPDATE: docs/sdk/CHATS.md` - what a stop does with a steering message the CLI holds.
- `UPDATE: .project/specs/agent-backends.md` - the stop.

## Steps

1. Record with each owed prompt the turn it belongs to and the steering message's id.
2. Record from `command_lifecycle` frames whether the CLI holds a prompt or has started it.
3. Pass over a frame of a prompt that belongs to a turn that is not running.
4. End the active turn at a result only when the result names a prompt of that turn, or names none.
5. Read a result that names a stopped turn's prompt as the stop's, never as a failure.
6. Move the steering messages the CLI holds to a turn opened when their turn stops or fails.
7. Open that turn with the first message, under its uuid, with its id as `queuedMessageId`.
8. Add the cases, the fixtures, the docs and the spec.

## Validation

- `agent-claude-late-steer.test.ts` holds the stop cases: a steering message the CLI holds, one it folded in, and nothing queued.
- The case with a steering message held fails before this task, and so does the case with nothing queued.
- The folded case guards that no turn opens for a message the CLI took in.
- Read back after a restart, a steering message answered after a failure is its own turn, as live.
  The host recorded that turn as it began; left out of the record, it reads back inside the failed turn.
- `agent-claude-late-steer.test.ts`, `agent-claude-cancelled-turn.test.ts` and `host-local-turns.test.ts` pass at one worker.

## Resume

Done 2026-10-28.
On task 03's code three of the four new cases failed, and the folded guard passed.
After a stop or a failure, no turn was active until the steering message's answer came.
The host would have begun a turn sent meanwhile.
The stopped turn's result ended a turn begun after the stop as a failure.
The cases for a stop, a result's usage, a resumed prompt and a recorded turn pass too.
So do the six files that drive the steering path.
The failure case of `host-local-turns.test.ts` fails with the turns a backend opens left out of the record.
