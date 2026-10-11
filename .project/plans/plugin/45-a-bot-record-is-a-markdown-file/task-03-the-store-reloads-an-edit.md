---
title: The store reloads a file a person edits
status: todo
depends: [task-01-the-store-reads-and-writes-markdown.md]
layer: "packages/bot"
refs:
  - "[code://packages/sdk/src/resources.ts#L503](../../../../packages/sdk/src/resources.ts#L503) - the file store's `watch`"
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - `told`, from plan 43"
---

## Objective

An added, changed or removed `.md` file in the bot folder changes what the store holds while the daemon runs.
Each watcher and the catalogue hear about it.

## Files

- `UPDATE: packages/bot/src/store.ts` - a folder watch, a reload of one slug, and an `onChange` option.
- `UPDATE: packages/bot/src/provider.ts` - give the store an `onChange` that calls `told`.
- `UPDATE: packages/bot/src/plugin.ts` - close the watch when the plugin closes.
- `UPDATE: packages/bot/test/bot-store.test.ts` - cases for a hand edit.

## Steps

1. Watch the bot folder with `node:fs.watch` when the store opens.
2. Read again the one slug an event names, after a short wait that collects the events of one save.
3. Ignore an event when the file holds what the store wrote last.
4. Replace the record, and call `onChange('updated', record)`, or `onChange('added', record)` for a new slug.
5. Remove the record when its file is gone, and call `onChange('deleted', record)`.
6. Leave a slug that has a tombstone deleted, and report its file.
7. Report a file that fails `kept`, and keep the record the store had.
8. Report and keep the old record when an edit changes `owner` or `workspace`.
9. Call `told` from the provider's `onChange`.
10. Close the watch when the plugin closes.

## Validation

- Make sure `resourceRead` answers an edit to `name` in the file, and a watch on `bot://` hears `updated`.
- A file copied into the folder under a new slug is a new bot, and a watch hears `added`.
- Make sure the store reports a file with broken frontmatter, and `resourceRead` answers the old record.
- Make sure the store reports an edit that changes `owner`, and keeps the old owner.
- A write through the scheme causes one notice, not two.
- `pnpm exec vitest run packages/bot` passes.

## Resume
