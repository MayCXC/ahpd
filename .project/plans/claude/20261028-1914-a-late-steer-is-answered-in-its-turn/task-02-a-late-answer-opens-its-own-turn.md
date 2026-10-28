---
title: A prompt the CLI answers after its turn ended opens a turn carrying it
status: done
depends: [task-01-a-steered-turn-ends-when-answered.md]
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/parts.ts#L227-L257](../../../../packages/agent-claude/src/session/parts.ts#L227-L257) - `openTurn`, which opens a turn nobody began with an empty message"
  - "[code://packages/agent-claude/src/session/turns.ts#L661-L720](../../../../packages/agent-claude/src/session/turns.ts#L661-L720) - `cancel`, which interrupts the CLI"
---

## Objective

A steering message the CLI still owes when its turn ends is answered in a turn of its own, which carries that message.
The rest of a stopped turn's own answer joins no turn and opens none.

## Files

- `UPDATE: packages/agent-claude/src/session/parts.ts` - `openTurn` takes the id and the message of the turn it opens.
- `UPDATE: packages/agent-claude/src/session/query.ts` - a frame of the session's own agent that answers an owed steering message opens its turn when none is active, and one that answers another turn's own prompt is passed over.
- `UPDATE: packages/agent-claude/test/agent-claude-late-steer.test.ts` - the case for a stop with a steering message queued.
- `CREATE: packages/agent-claude/test/fixtures/claude-cancelled-steer.jsonl` - a turn interrupted after the CLI queued a second prompt, which then ran.
- `UPDATE: docs/sdk/CHATS.md` - a steering message the CLI still holds at a stop.
- `UPDATE: .project/specs/agent-backends.md` - the scenario's stop.

## Steps

1. Give `openTurn` an optional opening: the turn's id and its message.
2. Keep the prompt the CLI is answering, from each frame of the session's own agent that names one.
3. Open an owed steering message's turn under its uuid when no turn is active.
4. Pass over a frame that answers an owed own prompt of a turn that is not running.
5. Add the case, its fixture and the docs.

## Validation

- `agent-claude-late-steer.test.ts` holds the stop case: the turn ends cancelled, and a new turn carries the steering message.
- The case fails after task 01 and before this task.

## Resume

Done 2026-10-28.
On task 01's code the stop case failed.
The stopped answer's last frames opened a turn with an empty message, and its interrupted result ended that turn as a failure.
The steering message's answer then opened a second turn with an empty message.
The stop takes nothing out of the map itself, because the interrupted result names the stopped prompt.
