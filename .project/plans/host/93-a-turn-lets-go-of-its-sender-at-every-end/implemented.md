---
title: A turn lets go of its sender at every end - implemented
date: 2026-10-15
refs:
  - git://358fba6b
  - "[code://packages/sdk/src/host/owners.ts](../../../../packages/sdk/src/host/owners.ts)"
  - "[code://packages/sdk/src/host/spawn.ts](../../../../packages/sdk/src/host/spawn.ts)"
  - "[code://packages/sdk/src/host/lifecycle.ts](../../../../packages/sdk/src/host/lifecycle.ts)"
---

The host deletes the `senders` and `sentBy` entry of a turn or a queued message at each end it knows.

## What was built

- [`code://packages/sdk/src/host/owners.ts`](../../../../packages/sdk/src/host/owners.ts) - `forgetSender` deletes one id, and `forgetSendersIn` deletes the ids that a chat's state names.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - a queued message that starts a turn gives its entry to the turn, and `chat/error` releases the turn.
- [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - a refused `!` command deletes its entry, and `teardown` deletes the entries of each chat.
- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - a queued message that a client removes deletes its entry.
- [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts) - `disposeChat` deletes the entries of the chat.

## Verified

- `host-senders.test.ts` has seven cases, and each fails without its change.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- Vitest on sdk, server, agent-claude and agent-acp passes 4552 of 4553 tests. `nested-start` failed once under load and passed alone four times.

## Departures from the plan

- None.

## Left for later

- See [deferred.md](deferred.md).
