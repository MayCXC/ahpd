---
title: A chat keeps the backend that serves it
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/sessions.ts#L94-L134](../../../../packages/sdk/src/types/sessions.ts#L94-L134) - `StoredChat`"
  - "[code://packages/sdk/src/host/chatrecord.ts#L106-L143](../../../../packages/sdk/src/host/chatrecord.ts#L106-L143) - `keepChat`"
  - "[code://packages/sdk/src/host/chatrecord.ts#L194-L200](../../../../packages/sdk/src/host/chatrecord.ts#L194-L200) - the hidden row `dropChat` keeps"
  - "[code://packages/sdk/src/sessions/sessions.ts#L381-L401](../../../../packages/sdk/src/sessions/sessions.ts#L381-L401) - `chatsOf`"
  - "[code://packages/sdk/src/host/state.ts#L13-L46](../../../../packages/sdk/src/host/state.ts#L13-L46) - `Held`"
  - "[code://packages/sdk/src/host/spawn.ts#L1540-L1640](../../../../packages/sdk/src/host/spawn.ts#L1540-L1640) - the `Held` join, `keepChat` and `owners.set`"
---

## Objective

A chat row says which backend serves it, and holds that backend's config.
The host holds a foreign chat's agent and config on the session, and the session keeps its own provider.

## Files

- `UPDATE: packages/sdk/src/types/sessions.ts:94-134` - `StoredChat` gains `provider?` and `config?`.
- `UPDATE: packages/sdk/src/sessions/sessions.ts:381-401` - `chatsOf` reads both fields.
- `UPDATE: packages/sdk/src/host/chatrecord.ts:106-143` - `keepChat` takes a provider and config, and copies both from the old row.
- `UPDATE: packages/sdk/src/host/chatrecord.ts:194-200` - the hidden row keeps both fields.
- `UPDATE: packages/sdk/src/host/state.ts:13-46` - `Held` gains `backends`, a map from a chat URI to its agent and config.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:953` - `chatAgent(held, chat)` and `chatConfig(held, chat)` beside `backendsOwn`.
- `UPDATE: packages/sdk/src/host/spawn.ts:1540-1640` - a chat of another agent goes on `Held.backends`, and skips `owners.set` and `keepProvider`.
- `UPDATE: packages/sdk/test/sessions.test.ts` - the two fields round-trip.
- `UPDATE: packages/sdk/test/session-provider.test.ts` - a foreign chat does not change the session's provider.

## Steps

1. Add `provider?` and `config?` to `StoredChat`, with a comment for each.
2. Read both fields in `chatsOf`, and drop a value of the wrong type.
3. Give `keepChat` a provider and a config, and copy both from the old row when absent.
4. Keep both fields on the hidden row that `dropChat` writes.
5. Add `backends` to `Held`.
6. Add `chatAgent` and `chatConfig`, which answer the chat's entry or the session's own.
7. In `spawn`, put a chat whose agent is not `held.agent` on `Held.backends`.
8. Pass that chat's provider and config to `keepChat`.
9. Skip `owners.set` and `keepProvider` for that chat.
10. Add the tests, and run the sdk tests.
11. Set this task and its plan row to `implemented`.

## Validation

- `sessions.test.ts`: a chat with `provider` and `config` reads back the same; a row with neither reads as before.
- `session-provider.test.ts`: a chat of agent B leaves the session's provider and owner as agent A.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
