---
title: A prompt the CLI answers after its turn ended opens a turn carrying it
status: doing
depends: [task-01-a-steered-turn-ends-when-answered.md]
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/parts.ts#L227-L257](../../../../packages/agent-claude/src/session/parts.ts#L227-L257) - `openTurn`, which opens a turn nobody began with an empty message"
  - "[code://packages/agent-claude/src/session/turns.ts#L661-L720](../../../../packages/agent-claude/src/session/turns.ts#L661-L720) - `cancel`, which interrupts the CLI"
---

## Objective

A steering message the CLI still owes when its turn ends is answered in a turn of its own, which carries that message.
A stopped turn's own prompt is not one of them, because the CLI cancels it with the stop.

## Files

- `UPDATE: packages/agent-claude/src/session/parts.ts` - `openTurn` takes the id and the message of the turn it opens, when the frame names an owed prompt.
- `UPDATE: packages/agent-claude/src/session/query.ts` - a stream or assistant frame of the session's own agent that names an owed prompt opens that prompt's turn when none is active.
- `UPDATE: packages/agent-claude/src/session/turns.ts` - `cancel` takes the stopped turn's own prompt out of the map.
- `UPDATE: packages/agent-claude/test/agent-claude-late-steer.test.ts` - the case for a stop with a steering message queued.
- `CREATE: packages/agent-claude/test/fixtures/claude-cancelled-steer.jsonl` - a turn interrupted after the CLI queued a second prompt, which then ran.

## Steps

1. Give `openTurn` an optional opening: the turn's id and its message.
2. Read `user_message_uuid` from each frame of the session's own agent before handling the frame.
3. Open the owed prompt's turn under its uuid when no turn is active and the frame names it.
4. Remove the stopped turn's own prompt from the map in `cancel`.
5. Add the case and its fixture.

## Validation

- `agent-claude-late-steer.test.ts` holds the stop case: the turn ends cancelled, and a new turn carries the steering message.
- The case fails after task 01 and before this task.

## Resume

Empty until started.
