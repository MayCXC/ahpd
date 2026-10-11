---
title: A bot edited by hand reaches the provider
status: todo
depends: [task-01-the-bot-store-is-a-collection.md]
layer: "packages/bot"
refs:
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - `told`, which plan 43 adds"
---

## Objective

A change to the `bots` collection that the store did not make updates the cache and reaches watchers.

## Files

- `UPDATE: packages/bot/src/store.ts` - watch `bots`, and an `onChange` the provider gives.
- `UPDATE: packages/bot/src/provider.ts` - call `told` from `onChange`.
- `UPDATE: packages/bot/test/bot-store.test.ts` - cases for a change from outside.

## Steps

1. Watch the `bots` collection when the store loads.
2. On `added` or `updated`, read the record, pass it through `kept`, and replace the cache entry.
3. Refuse a change to `owner` or `workspace`, report it, and keep the old record.
4. On `deleted`, remove the cache entry and put a tombstone in `bots-gone`.
5. Call `onChange` with the slug and the change type after each cache change.
6. Give `onChange` from the provider, and call `told` there.

## Validation

- `bot-store.test.ts` changes a record in the collection from outside, and a `bot://` watcher hears `updated`.
- The store reports a change to `owner` from outside, and the bot keeps its owner.
- The store reports a record that fails `kept`, and the bot reads as before.
- `pnpm exec vitest run packages/bot` passes.

## Resume
