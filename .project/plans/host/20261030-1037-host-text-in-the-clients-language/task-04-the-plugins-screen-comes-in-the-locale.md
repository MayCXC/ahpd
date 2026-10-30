---
title: The plugins screen comes in the locale
status: todo
depends: [task-02-the-host-and-each-plugin-carry-a-catalog.md]
layer: sdk, server
refs:
  - "[code://packages/sdk/src/resources/recordschannel.ts#L186-L215](../../../../packages/sdk/src/resources/recordschannel.ts#L186-L215) - `send`, one action to one reader on one client"
  - "[code://packages/server/src/pluginschannel.ts#L226-L268](../../../../packages/server/src/pluginschannel.ts#L226-L268) - `rowOf`, the plugin row"
---

## Objective

A records channel may translate a record for each reader, in the locale of the reader's client.
The `x-ahpd-plugins` rows come in that locale: the title, the manifest description and the options form.

## Files

- `UPDATE: packages/sdk/src/resources/recordschannel.ts:186-215` - an optional `translate(record, locale)`, called in `send` and on each snapshot.
- `UPDATE: packages/server/src/pluginschannel.ts:226-268` - a `translate` that uses the plugin's own catalogs, then the host's.
- `UPDATE: packages/sdk/test/recordschannel.test.ts` - a channel with `translate` sends each reader its own text.
- `UPDATE: packages/server/test/plugins-channel.test.ts` - a row in `pt` for a plugin with a `pt` catalog.

## Steps

1. Add `translate?: (record, locale) => record` to the records channel options.
2. Call it with `localeOf(client)` in `send` and in the snapshot of each reader, and never on the stored record.
3. Compare records for a diff before the translation, so a locale never makes a change on its own.
4. In `pluginschannel.ts`, translate `title` from `meta.title` and `manifest.description` from `meta.description`.
5. Translate the options form with `formIn` from task 03, with the `options` block.
6. Leave `name`, `spec`, `state`, `version`, `problem` and `alerts` as they are.
7. Write the tests.

## Validation

- Two readers on two clients, one `pt` and one `en`, get the same row in their own language.
- A reader with no locale gets the row as before this task.
- A change of a plugin's state sends each reader one diff, also when the two translations differ.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
