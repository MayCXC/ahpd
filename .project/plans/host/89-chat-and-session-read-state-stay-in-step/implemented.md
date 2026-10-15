---
title: Chat and session read state stay in step - implemented
date: 2026-10-15
refs:
  - git://11417588
  - "[code://packages/sdk/src/host/chatactions.ts](../../../../packages/sdk/src/host/chatactions.ts)"
  - "[code://packages/sdk/src/host/spawn.ts](../../../../packages/sdk/src/host/spawn.ts)"
---

A chat and its session now keep one read state, and the host clears a chat's read bit where the protocol's chat reducer clears it.

## What was built

- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - `chatFlag`, `countedChats`, `sessionFollows` and `startsRead`. A session read marks each counted chat read, and a chat archived is read.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - `chat/turnStarted`, `chat/turnResume` and `chat/inputRequested` clear the read bit, and each turn end marks the chat unread.
- [`code://packages/sdk/src/host/context.ts`](../../../../packages/sdk/src/host/context.ts) - `commandTurns`, so a `!` command turn ends with the read bit it had at its start.
- [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - a new session and its chat start read.

## Verified

- `host-catalogue.test.ts`, `host-snapshots.test.ts`, `host-terminals.test.ts` and `subagent-chat.test.ts` have the cases of the checklist.
- `ahp-test-cases.test.ts` marks each new session unread before a case, so `HOST_OWNS` is the same as before this plan.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- Vitest on sdk, server, agent-claude and agent-acp passes 4520 tests. `nested-start` failed once under load and passed alone.

## Departures from the plan

- A turn start clears the read bit, by Softov's answer of 2026-10-15. The plan first cleared it only at the turn end.

## Left for later

- See [deferred.md](deferred.md).
