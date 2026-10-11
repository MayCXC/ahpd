---
title: The bot provider reports a make, an edit and a delete
status: done
depends: [task-01-a-provider-watch-knows-its-reader.md]
layer: "packages/bot"
refs:
  - "[code://packages/bot/src/provider.ts#L365-L454](../../../../packages/bot/src/provider.ts#L365-L454) - `write` and `remove`"
  - "[code://packages/bot/src/provider.ts#L184-L191](../../../../packages/bot/src/provider.ts#L184-L191) - `mayRead`"
  - "[code://packages/sdk/src/resources.ts#L503-L575](../../../../packages/sdk/src/resources.ts#L503-L575) - the file store's `watch`"
---

## Objective

`watch` on `bot://` reports each bot the reader may read when it is made, edited or deleted.
`watch` on `bot://<slug>` reports that one bot.

## Files

- `UPDATE: packages/bot/src/provider.ts` - a watcher set, `watch`, and `told`, called from `write` and `remove`.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - cases through `createResourceWatch` and `subscribe`.

## Steps

1. Keep a set of watchers in `botProvider`, each with its URI, callback and reader.
2. Add `watch(uri, options, onChange, reader)` that refuses a URI under a slug's own path.
3. Refuse a slug that does not exist, with the error `read` gives for it.
4. Answer a `Watcher` whose `close()` removes the watcher from the set.
5. Add `told(type, record)`, which calls each watcher whose URI is `bot://` or the record's URI.
6. Skip a watcher whose reader `mayRead` refuses for the record, unless the reader is `undefined`.
7. Call `told('added', record)` after `store.put` for a make.
8. Call `told('updated', record)` after `store.put` for an edit.
9. Call `told('deleted', bot)` after `store.remove`, with the record read before the delete.
10. Catch an error from one callback, so the other watchers still hear the change.

## Validation

- A watch on `bot://` hears `added`, `updated` and `deleted` for a bot its owner makes, edits and deletes.
- A watch on `bot://motion` hears changes to `motion` and nothing about `other`.
- A member of no team hears nothing about a team bot, and a team member hears it.
- No change reaches a watch after its last subscriber leaves.
- `pnpm exec vitest run packages/bot` passes.

## Resume
