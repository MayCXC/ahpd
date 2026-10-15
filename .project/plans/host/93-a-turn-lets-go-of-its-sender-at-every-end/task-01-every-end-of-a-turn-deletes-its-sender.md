---
title: Every end of a turn deletes its sender
status: done
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L774-L834](../../../../packages/sdk/src/host/spawn.ts#L774-L834) - the move of a queued entry and the release at the turn end"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1228-L1251](../../../../packages/sdk/src/host/lifecycle.ts#L1228-L1251) - the entry and the command refusal"
  - "[code://packages/sdk/src/host/chatactions.ts#L1355-L1359](../../../../packages/sdk/src/host/chatactions.ts#L1355-L1359) - the removal of a queued message"
---

## Objective

No entry stays in `senders` or `sentBy` after its turn ends or its queued message goes.

## Files

- `UPDATE: packages/sdk/src/host/owners.ts:118-135` - `forgetSender` deletes one id from both maps, and `forgetSendersIn` deletes the ids that a chat's state names.
- `UPDATE: packages/sdk/src/host/spawn.ts:774-786` - the move deletes the entry under the queued id.
- `UPDATE: packages/sdk/src/host/spawn.ts:829-834` - `chat/error` deletes the entry too.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1246-1251` - the command refusal deletes the entry it wrote.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:218-225` - `teardown` deletes the entries of each chat before it closes the chat.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1316-1320` - `disposeChat` deletes the entries of the chat before it closes the chat.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1355-1359` - a removed queued message deletes its entry.
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

## Resume

### Built

- `owners.ts` has `forgetSender`, which deletes one id from `senders` and `sentBy`.
- `owners.ts` has `forgetSendersIn`, which deletes the id of the running turn and the id of each queued message that a chat's state names.
- At `chat/turnStarted` with a `queuedMessageId`, the host copies the entry to the turn and then deletes the queued id. The delete is skipped when the backend uses the queued id as the turn id.
- `chat/error` releases the turn, as `chat/turnComplete` and `chat/turnCancelled` do.
- In `beginOrRun`, the `!` command refusal deletes the entry that the call wrote.
- `chat/pendingMessageRemoved` of the `queued` kind deletes the entry of its id.
- The echo and Claude backends send no turn end when a chat closes. Thus `teardown` and `disposeChat` call `forgetSendersIn` before they close a chat.

### Validation

- `packages/sdk/test/host-senders.test.ts` reads the two maps through a mock of `createOwners`. It has seven cases.
- A queued message that becomes a turn and completes leaves both maps empty.
- The turn of a queued message carries `ahpd.sender` of the person who queued it, as `host/38` asks.
- A turn that ends with `chat/error` leaves both maps empty.
- A queued message that a client removes leaves both maps empty.
- The host refuses a `!` command on the echo backend, which has no `ran`, and both maps stay empty.
- A session disposed with a turn running and a message queued leaves both maps empty.
- A chat disposed with a turn running leaves both maps empty.
- Each case fails without its change. The `host/38` case fails when the move deletes the queued id before the copy.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` passes: 249 files and 4553 tests.

### Seen and not done

- A chat that closes with `stopping` keeps the entries of its running turn and its queued messages. Restart, sleep and the daemon stop close chats this way. The plan names the dispose only. This task did not check whether a restarted chat runs its queued messages again under the same ids.
- `ctx.commandTurns` keeps the entry of a queued `!` command that a client removes, and the entries of a disposed chat.
- A `chat/pendingMessageRemoved` that a backend emits by itself does not delete an entry. Only the removal that a client dispatches does.
