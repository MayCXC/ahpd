---
title: The bot store is a collection
status: todo
depends: []
layer: "packages/bot"
refs:
  - "[code://packages/bot/src/store.ts#L83-L128](../../../../packages/bot/src/store.ts#L83-L128) - `botStore`"
  - "[code://packages/bot/src/plugin.ts#L37-L50](../../../../packages/bot/src/plugin.ts#L37-L50) - `apply`"
---

## Objective

`botStore` keeps bots in the `bots` collection and tombstones in `bots-gone`, with a cache that the provider reads.

## Files

- `UPDATE: packages/bot/src/store.ts` - `botStore(bots, graves, onProblem)` over two collections, with no file code.
- `UPDATE: packages/bot/src/plugin.ts:37` - open the two collections with `host.records`.
- `UPDATE: packages/bot/src/provider.ts` - wait for the store before the first answer, and wait for `put` and `remove`.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - give `memoryRecords` collections.
- `CREATE: packages/bot/test/bot-store.test.ts` - cases for the cache and the tombstones.

## Steps

1. Open `bots` with `{ body: 'instructions' }`, and `bots-gone` with no body.
2. Add `ready()` to `BotStore`, and load both collections into the cache there once.
3. Pass each loaded record through `kept`, and report each one that fails.
4. Make `put` and `remove` answer promises, and change the cache after the collection answers.
5. On `remove`, put `{ id, deletedAt }` in `bots-gone`, then remove the bot.
6. Await `ready()` at the start of each provider call.
7. Remove `written`, `slugsIn` and every `node:fs` import.

## Validation

- `bot-store.test.ts` puts, reads, removes and makes a bot again, and the re-make fails with `-32010`.
- The provider tests pass over `memoryRecords`.
- `rg -n "node:fs" packages/bot/src` finds nothing.
- `pnpm exec vitest run packages/bot` and `pnpm -s typecheck` pass.

## Resume
