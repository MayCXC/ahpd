---
title: A steering message is answered in the turn it steers - implemented
date: 2026-10-28
refs:
  - git://96fb0b20
  - git://969bbbe9
  - git://5c302a50
  - git://e261e85b
  - git://ac062da4
  - git://7d66b07c
  - "[code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts)"
  - "[code://packages/agent-claude/src/session/turns.ts](../../../../packages/agent-claude/src/session/turns.ts)"
  - "[code://packages/agent-claude/src/session/parts.ts](../../../../packages/agent-claude/src/session/parts.ts)"
  - "[code://packages/agent-claude/src/transcript.ts](../../../../packages/agent-claude/src/transcript.ts)"
  - "[code://packages/sdk/src/host/localturns.ts](../../../../packages/sdk/src/host/localturns.ts)"
  - "[code://packages/sdk/src/host/spawn.ts](../../../../packages/sdk/src/host/spawn.ts)"
  - "[code://packages/agent-pi/src/session.ts](../../../../packages/agent-pi/src/session.ts)"
---

A steering message that the Claude CLI answers after the turn's last answer is answered inside the turn it steers.
The turn stays open until the CLI has answered every prompt it was handed in it, and a queued message waits for that.
A transcript read back after a restart shows the turns a client saw live.
The host records the transcript id each turn began under, and reads a turn it holds no beginning for back inside the turn before it.
A turn that stops or fails while the CLI holds its steering messages opens the turn that answers them at once.
A turn sent meanwhile waits behind that turn, and a stopped turn's result ends no turn that is running.

## What was built

- [`code://packages/sdk/src/host/localturns.ts`](../../../../packages/sdk/src/host/localturns.ts) - the record of the turns a chat began, one file a transcript id under the chat's folder, beside its local turns.
  `transcriptOf` reads a turn the record holds no beginning for back inside the turn before it, before the local turns go back.
  The record follows a truncation, a fork, a removal and a move.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - a turn's start and `onTurnRecorded` write the record.
- [`code://packages/agent-pi/src/session.ts`](../../../../packages/agent-pi/src/session.ts) - a turn names its prompt's entry however it ends, and when its session closes under it.
- [`code://packages/agent-claude/src/session/context.ts`](../../../../packages/agent-claude/src/session/context.ts) - `owed`, each prompt the CLI was handed and no result has named, with the turn it belongs to.
  Each entry keeps a steering message's own id and what the CLI said it did with the prompt.
- [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts) - `push` records each prompt it sends, and `steer` sends under the steering id or a new uuid.
  `startNext` waits while the map holds a prompt.
  `cancel` hands the steering messages the CLI holds to a turn of their own, through `handOver` and `present`.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - reads `command_lifecycle` frames, and gives each frame and result to the turn its prompts belong to.
  A result ends the running turn only when that turn owes nothing or the result failed.
  A turn that ends hands over the steering messages it leaves.
  A resumed session ends a turn read back with others inside it where the last of them ends.
- [`code://packages/agent-claude/src/session/parts.ts`](../../../../packages/agent-claude/src/session/parts.ts) - `openTurn` opens a turn with the id, the message and the steering id it is given.
- [`code://packages/agent-claude/src/transcript.ts`](../../../../packages/agent-claude/src/transcript.ts) - `buildTurns` keeps a message the reader marks `isQueuedCommand` in its turn, and reads the CLI's stop text as the end of a cancelled turn.
- [`code://packages/agent-claude/test/agent-claude-late-steer.test.ts`](../../../../packages/agent-claude/test/agent-claude-late-steer.test.ts) - thirteen cases fed six captures of the real CLI and four transcripts its reader returned.
- [`code://packages/sdk/test/host-local-turns.test.ts`](../../../../packages/sdk/test/host-local-turns.test.ts) - a chat read back by a host started again on the same store.
  The Claude cases run captures through the real backend and read back what the SDK's reader returned for the same sessions.
- [`code://packages/sdk/test/localturns.test.ts`](../../../../packages/sdk/test/localturns.test.ts) - the record and the read, alone.

## Verified

- Tasks 01 and 02: four of their five cases failed on the code before their task, and the folded steer passed before and after.
- Task 03: before the record, seven of the nine cases in `localturns.test.ts` that read it failed, and both host cases did.
  The four read-back cases of `agent-claude-late-steer.test.ts` failed on task 02's read code, and the two end cases before the seeded ends.
  The capture case of `host-local-turns.test.ts` reads back three turns where the client saw two with the record's read switched off.
- Task 04: three of its four new cases failed on task 03's code, and the folded stop passed before and after.
  Its failure case through a host fails with the turns a backend opens left out of the record.
- pi's case of a session closed under its turn failed before pi named the entry there.
- Typecheck is clean.

## Departures from the plan

- A stop takes nothing out of the map itself: the interrupted result names the stopped prompt, and the frames before it are passed over.

## Left for later

- A stopped turn reads back with the whole answer the CLI wrote before it stopped.
  Live, it shows what had streamed when the stop came.
