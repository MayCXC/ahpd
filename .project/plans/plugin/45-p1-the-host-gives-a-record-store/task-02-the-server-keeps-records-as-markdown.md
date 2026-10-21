---
title: The server keeps records as Markdown files
status: done
depends: [task-01-the-sdk-declares-the-record-store.md]
layer: "packages/server"
refs:
  - "[code://packages/server/src/commands/run.ts#L654-L661](../../../../packages/server/src/commands/run.ts#L654-L661) - where the daemon gives its default ports"
  - "[code://packages/bot/src/store.ts#L41-L48](../../../../packages/bot/src/store.ts#L41-L48) - `written`, a file written whole at mode `0600`"
  - "[code://packages/sdk/src/sessions/sessions.ts#L712-L740](../../../../packages/sdk/src/sessions/sessions.ts#L712-L740) - `migrateSessions`"
  - "[code://packages/sdk/src/resources/resources.ts#L503](../../../../packages/sdk/src/resources/resources.ts#L503) - the file store's `watch`"
---

## Objective

`fileRecords(configDir)` is the daemon's default record store.
Each record is `<configDir>/<name>/<id>.md`: the fields as YAML frontmatter, and the body field as the Markdown body.

## Files

- `UPDATE: packages/server/package.json` - depend on `@cofold/yaml`.
- `CREATE: packages/server/src/records.ts` - `fileRecords`, and `recordFile` and `readRecordFile` for one file.
- `UPDATE: packages/server/src/commands/run.ts:654` - give `fileRecords(configDir())` as the `records` port.
- `UPDATE: packages/server/src/plugins.ts:876` - give each plugin host the `records` port and one shared `collections` map.
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
11. Pass `records` to `pluginHost`, read from the host when a collection is first used.
12. Make one `collections` map in the loader, and pass it to every plugin host.

## Validation

- `records.test.ts` puts a record with a multi-line body, and finds the body as plain text below the frontmatter.
- A record read back is equal to the record put.
- A `<id>.json` converts once, and the `.json.migrated` file stays.
- A hand edit of `<id>.md` reaches a watcher as `updated`, and the store's own `put` reaches it once.
- The store reports a file with a broken frontmatter, and `get` still answers the record from before.
- A plugin that the daemon loads opens a collection, and the loader refuses the same name to a second plugin.
- `pnpm exec vitest run packages/server` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** all steps. `records.test.ts` has 13 cases, and they pass.
- **Built as:** `fileRecords(dir, { onProblem })` keeps each collection's records in memory after the first open, and the folder watch keeps them current. `get`, `list` and `find` answer from that copy.
- **Built as:** the store keeps the last text it wrote or read for each file. An event for that text is not a change.
- **Built as:** the body ends with one newline in the file, and a read removes it. A record with no body field reads back with an empty body field.
- **Built as:** `put` refuses a body field that is not text.
- **Built as:** the sdk index exports `isRecordSlug` and `RECORD_SLUG`, so the server uses the same slug rule.
- **Built as:** `@cofold/yaml` is a `link:` to the local cofold build until cofold publishes `stringifyYaml`.
