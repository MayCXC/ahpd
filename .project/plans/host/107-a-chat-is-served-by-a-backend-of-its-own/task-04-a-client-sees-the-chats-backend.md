---
title: A client sees the chat's backend
status: todo
depends:
  - task-03-a-plugin-starts-a-chat-on-a-backend.md
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/snapshots.ts#L324-L335](../../../../packages/sdk/src/host/snapshots.ts#L324-L335) - the live `ChatState`"
  - "[code://packages/sdk/src/host/catalogue.ts#L508](../../../../packages/sdk/src/host/catalogue.ts#L508) - the session's `provider` in its row"
---

## Objective

A client reads which backend serves a chat in the chat's state.
The session's provider stays the session's own.

## Files

- `UPDATE: packages/sdk/src/host/snapshots.ts:324-335` - `_meta['ahpd.provider']` on a foreign chat's state.
- `UPDATE: packages/sdk/test/host-snapshots.test.ts` - the session's provider and the chat's `_meta`.
- `UPDATE: docs/sdk/AHP.md` - the `ahpd.provider` key.

## Steps

1. Lay `_meta['ahpd.provider']` over the chat state's own `_meta` for a foreign chat.
2. Leave a chat of the session's own backend without the key.
3. Keep the session's `provider` in its row and snapshot as it is.
4. Document the key in AHP.md, beside the other `ahpd.*` keys.
5. Add the tests, and run the sdk tests.
6. Set this task and its plan row to `implemented`.

## Validation

- `host-snapshots.test.ts`: a chat of agent B has `_meta['ahpd.provider']` B, and the session's provider is A.
- `host-snapshots.test.ts`: a chat of agent A has no `ahpd.provider` key.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
