---
title: The server keeps records as Markdown files
status: todo
depends: [task-01-the-sdk-declares-the-record-store.md]
layer: "packages/server"
refs:
  - "[code://packages/server/src/commands/run.ts#L654-L661](../../../../packages/server/src/commands/run.ts#L654-L661) - where the daemon gives its default ports"
  - "[code://packages/bot/src/store.ts#L41-L48](../../../../packages/bot/src/store.ts#L41-L48) - `written`, a file written whole at mode `0600`"
  - "[code://packages/sdk/src/sessions.ts#L712-L740](../../../../packages/sdk/src/sessions.ts#L712-L740) - `migrateSessions`"
  - "[code://packages/sdk/src/resources.ts#L503](../../../../packages/sdk/src/resources.ts#L503) - the file store's `watch`"
---

## Objective

`fileRecords(configDir)` is the daemon's default record store.
Each record is `<configDir>/<name>/<id>.md`: the fields as YAML frontmatter, and the body field as the Markdown body.

## Files

- `UPDATE: packages/server/package.json` - depend on `@cofold/yaml`.
- `CREATE: packages/server/src/records.ts` - `fileRecords`, and `recordFile` and `readRecordFile` for one file.
- `UPDATE: packages/server/src/commands/run.ts:654` - give `fileRecords(configDir())` as the `records` port.
- `CREATE: packages/server/test/records.test.ts` - cases for the file shape, the conversion and the watch.

## Steps

1. Write `recordFile(record, body)`: `---`, the fields without `body` through `stringifyYaml`, `---`, then the body text.
2. Write `readRecordFile(text, body)`: split the frontmatter, parse it with `parseYaml`, and put the body text in the `body` field.
3. Write a record whole, through a temporary file and a rename, at mode `0600`.
4. Make the folder when a collection opens.
5. Convert each `<id>.json` with no `<id>.md` when a collection opens, then rename it to `<id>.json.migrated`.
6. Refuse a file whose frontmatter `id` is not its file name, and report it.
7. Keep the text written last for each file, and ignore a watch event whose file holds that text.
8. Tell each watcher `added`, `updated` or `deleted` with the id, for each `put`, `remove` and hand edit.
9. Report a file that does not parse, and do not tell watchers about it.
10. Give `fileRecords` as the daemon's `records` port.

## Validation

- `records.test.ts` puts a record with a multi-line body, and finds the body as plain text below the frontmatter.
- A record read back is equal to the record put.
- A `<id>.json` converts once, and the `.json.migrated` file stays.
- A hand edit of `<id>.md` reaches a watcher as `updated`, and the store's own `put` reaches it once.
- The store reports a file with a broken frontmatter, and `get` still answers the record from before.
- `pnpm exec vitest run packages/server` and `pnpm -s typecheck` pass.

## Resume
