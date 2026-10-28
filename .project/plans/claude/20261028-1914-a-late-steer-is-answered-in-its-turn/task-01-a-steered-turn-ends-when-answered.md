---
title: A steered turn ends when the CLI has answered its prompts
status: done
depends: []
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/turns.ts#L529-L545](../../../../packages/agent-claude/src/session/turns.ts#L529-L545) - `steer`, which sends the message without a uuid"
  - "[code://packages/agent-claude/src/session/query.ts#L772-L858](../../../../packages/agent-claude/src/session/query.ts#L772-L858) - the result branch, which ends the turn at every result"
---

## Objective

A steering message the CLI answers after the turn's last answer is answered inside that turn.
The turn ends, and the queue starts, once the CLI has answered every prompt it was handed.

## Files

- `UPDATE: packages/agent-claude/src/session/context.ts` - the session's `owed` map: each prompt the CLI was handed and no result has named, with its message.
- `UPDATE: packages/agent-claude/src/session.ts` - the map, empty when the session starts.
- `UPDATE: packages/agent-claude/src/session/turns.ts` - `push` records a prompt it sends with a uuid; `steer` sends its message under a uuid.
- `UPDATE: packages/agent-claude/src/session/query.ts` - a result removes the prompts it names, ends the turn only when nothing is owed or it failed, and starts the queue only when nothing is owed; `startQuery` and a CLI that dies clear the map.
- `CREATE: packages/agent-claude/test/agent-claude-late-steer.test.ts` - the cases, fed the frames the CLI sent.
- `CREATE: packages/agent-claude/test/fixtures/claude-late-steer.jsonl` - a second prompt sent at the first text delta of a turn with no tool call.
- `CREATE: packages/agent-claude/test/fixtures/claude-folded-steer.jsonl` - a second prompt sent at the tool call of a turn running `sleep 4`.
- `UPDATE: docs/sdk/CHATS.md` - what a steering message the CLI answers late does to its turn and the queue.
- `UPDATE: docs/sdk/AHP.md` - the `chat/pendingMessageSet` row.
- `UPDATE: .project/specs/agent-backends.md` - a scenario for a steering message answered late.

## Steps

1. Add `owed`, a map from a uuid to the message the prompt carried, to `SessionContext` and to the session.
2. Make `push` take the message it sends, and record it under its uuid when it has one.
3. Send a steering message under its own id when that id is a UUID.
4. Send any other steering message under a new uuid.
5. In the result branch, remove each uuid the result names in `user_message_uuids`, or in `user_message_uuid`.
6. Clear the map when a result names no prompt, as an older CLI sends.
7. End the active turn only when the map is empty or the result reports a failure.
8. Start the queue only when the map is empty.
9. Clear the map in `startQuery` and when the CLI dies.
10. Say what a late steering message does in the docs and the spec.

## Validation

- `agent-claude-late-steer.test.ts` holds four cases: a late steer, a non-UUID steering id, a folded steer and a waiting queue.
- Each case except the folded one fails before this task.
- The folded case guards that one result still ends the turn.
- `pnpm vitest run packages/agent-claude --maxWorkers=1`, then the sdk and server suites, one at a time.

## Resume

Done 2026-10-28.
The late steer, the steering id that is no UUID and the waiting queue failed on the code before this task, and pass.
The folded steer passed before and after.
A turn that took more than one of the CLI's turns is measured from its start, because a result's `duration_ms` is the last one's alone.
