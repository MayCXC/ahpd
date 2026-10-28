---
title: A Claude turn is written under its id - implemented
date: 2026-10-28
refs:
  - "[code://packages/agent-claude/src/session/turns.ts](../../../../packages/agent-claude/src/session/turns.ts)"
  - "[code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts)"
  - "[code://packages/agent-claude/test/agent-claude-turn-recorded.test.ts](../../../../packages/agent-claude/test/agent-claude-turn-recorded.test.ts)"
  - "[code://packages/sdk/test/host-local-turns.test.ts](../../../../packages/sdk/test/host-local-turns.test.ts)"
---

A Claude turn's prompt goes to the CLI with the uuid that its transcript names the turn by.
The host learns that uuid when the prompt goes out, whenever it is not the turn's own id.
A `!` turn after a Claude turn is anchored by that uuid, so a read after a restart puts it back.

## What was built

- [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts) - `push` puts a prompt's `uuid` on the message.
  `writtenAs` answers the turn's id when it is a UUID, or a new uuid that it reports through `onTurnRecorded`.
  A turn's first prompt and a failed turn sent again use it, and the second always takes a new uuid.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - the report from the first `user` frame and its set are gone.
- [`code://packages/agent-claude/src/session/common.ts`](../../../../packages/agent-claude/src/session/common.ts) - `UUID`, which `query.ts` and `turns.ts` both read.
- The comments in `spawn.ts` and `agent.ts` say that Claude writes a turn whose id is not a UUID under a uuid of its own.

## Verified

- `packages/agent-claude/test/agent-claude-turn-recorded.test.ts` reads the prompts that the session puts on the CLI's input.
  A UUID turn is written under its id, and another turn under a new uuid that is reported once.
  Two turns get two uuids, and a failed turn sent again gets a new one.
  These four cases fail on the code before this plan.
- `packages/sdk/test/host-local-turns.test.ts`: p1's Claude case sends no echo.
  Its `!` turn is anchored to the uuid that the Claude prompt carried, and comes back after a restart.
  On the code before this plan the anchor is the client's id, and the case fails.
- The agent-claude suite passes, 367 cases, and so does the sdk suite at one worker.
  Boundary, typecheck and build pass.

## Departures from the plan

- The fake SDK of the sdk suite records the uuid that each prompt carried, beside the text it records already.

## Left for later

- None.
