---
title: Every end of a turn deletes its sender
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L759-L815](../../../../packages/sdk/src/host/spawn.ts#L759-L815) - the move of a queued entry and the release at the turn end"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1041-L1058](../../../../packages/sdk/src/host/lifecycle.ts#L1041-L1058) - the entry and the command refusal"
  - "[code://packages/sdk/src/host/chatactions.ts#L1272-L1274](../../../../packages/sdk/src/host/chatactions.ts#L1272-L1274) - the removal of a queued message"
---

## Objective

No entry stays in `senders` or `sentBy` after its turn ends or its queued message goes.

## Files

- `UPDATE: packages/sdk/src/host/spawn.ts:759-766` - the move deletes the entry under the queued id.
- `UPDATE: packages/sdk/src/host/spawn.ts:810-815` - `chat/error` deletes the entry too.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1041-1058` - the command refusal deletes the entry it wrote.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1272-1274` - a removed queued message deletes its entry.
- `CREATE: packages/sdk/test/host-senders.test.ts` - the cases below.

## Steps

1. In the move at `chat/turnStarted`, delete the queued id from both maps after the copy.
2. Add `chat/error` to the turn end that deletes from both maps.
3. Write the entry in `beginOrRun` after the command refusal, or delete it when the refusal returns.
4. In `chat/pendingMessageRemoved` of the queued kind, delete the id from both maps.
5. Run a turn that a session dispose cuts, and check that both maps are empty after it.
6. Add the test cases below.

## Validation

- A test: a queued message that becomes a turn and completes leaves both maps empty.
- A test: a turn that ends with `chat/error` leaves both maps empty.
- A test: a queued message that a client removes leaves both maps empty.
- A test: a `!` command on a backend with no `ran` leaves both maps empty.
- A test: a queued message keeps its sender on the turn it becomes, as `host/38` asks.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk` and `packages/server`; all pass.
