---
title: A steering message is answered in the turn it steers - implemented
date: 2026-10-28
refs:
  - git://3035a036
  - "[code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts)"
  - "[code://packages/agent-claude/src/session/turns.ts](../../../../packages/agent-claude/src/session/turns.ts)"
  - "[code://packages/agent-claude/src/session/parts.ts](../../../../packages/agent-claude/src/session/parts.ts)"
---

A steering message that the Claude CLI answers after the turn's last answer is answered inside the turn it steers.
The turn stays open until the CLI has answered every prompt it was handed in it, and a queued message waits for that.
A steering message the CLI still holds when its turn is stopped is answered in a turn of its own, which carries the message.

## What was built

- [`code://packages/agent-claude/src/session/context.ts`](../../../../packages/agent-claude/src/session/context.ts) - `owed`, each prompt the CLI was handed and no result has named, with `prompt` and `answering`.
- [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts) - `push` records each prompt it sends under a uuid, and `steer` sends under the steering id or a new uuid.
  `startNext` waits while the map holds a prompt.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - a result takes out the prompts it names.
  It ends the turn only when the map is empty or the result failed.
  A frame that answers an owed steering message opens its turn when none is active.
  The rest of a stopped turn's own answer is passed over.
- [`code://packages/agent-claude/src/session/parts.ts`](../../../../packages/agent-claude/src/session/parts.ts) - `openTurn` takes the id and the message of the turn it opens.
- [`code://packages/agent-claude/test/agent-claude-late-steer.test.ts`](../../../../packages/agent-claude/test/agent-claude-late-steer.test.ts) - five cases fed three captures of the real CLI.

## Verified

- `agent-claude-late-steer.test.ts`: four of its five cases failed on the code before their task, and the folded steer passed before and after.
- agent-claude 405 passed at one worker.
- sdk 3654 passed and 2 skipped at one worker, once `tools/schema.mjs` had written the strict schema that seven of its files read.
- server 1632 passed and 2 skipped at one worker.
- Typecheck, boundary, the build of every package and the schema are clean.

## Departures from the plan

- A stop takes nothing out of the map itself: the interrupted result names the stopped prompt, and the frames before it are passed over.

## Left for later

- After a restart, a late steering message reads back from the transcript as a turn of its own.
- A new turn begun while the CLI still owes a stopped turn's steering message takes that message's answer into itself.
