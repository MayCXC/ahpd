---
title: A collection keeps JSON records
status: todo
depends: []
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/types/records.ts#L31-L50](../../../../packages/sdk/src/types/records.ts#L31-L50) - `CollectionOptions`, which gets `format`"
  - "[code://packages/server/src/records.ts#L118-L175](../../../../packages/server/src/records.ts#L118-L175) - `fileRecords`, which writes only `.md`"
---

## Objective

A collection opened with `format: "json"` keeps record `<id>` at `<name>/<id>.json`.
A Markdown collection is unchanged.

## Files

- `UPDATE: packages/sdk/src/types/records.ts:31-50` - add `format?: "md" | "json"` to `CollectionOptions`.
- `UPDATE: packages/server/src/records.ts:118-175` - read, write, list and watch `.json` files for a JSON collection.
- `UPDATE: packages/server/test/records.test.ts` - the cases below.

## Steps

1. Add `format` to `CollectionOptions`, with `md` as the default.
2. In `fileRecords`, choose the suffix from `format` in `fileOf` and `idsHere`.
3. Write a JSON record as pretty JSON with a final newline.
4. Read a JSON record with `JSON.parse`, and report a file that does not parse.
5. Skip the `.json` to `.md` migration for a JSON collection.
6. Refuse `body` and `file` on a JSON collection.
7. Run the records tests, and set this task and the plan row to `done`.

## Validation

- `records.test.ts`: a JSON collection writes `<id>.json`, and a new store reads it back.
- `records.test.ts`: a person's edit of a `.json` file reaches a watcher.
- `records.test.ts`: a JSON collection does not turn a `.json` file into `.md`.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a Markdown collection still turns a stray `<id>.json` into `.md` once.
