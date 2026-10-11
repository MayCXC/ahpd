---
title: A JSON record is converted at start
status: todo
depends: [task-01-the-store-reads-and-writes-markdown.md]
layer: "packages/bot"
refs:
  - "[code://packages/sdk/src/sessions.ts#L712-L740](../../../../packages/sdk/src/sessions.ts#L712-L740) - `migrateSessions`, the pattern"
---

## Objective

A daemon that starts with `<slug>.json` records has `<slug>.md` records, and every bot reads the same as before.

## Files

- `UPDATE: packages/bot/src/store.ts` - convert each `<slug>.json` that has no `<slug>.md`.
- `UPDATE: packages/bot/test/bot-store.test.ts` - cases for the conversion.

## Steps

1. Before the store loads, find each `<slug>.json` in the folder that has no `<slug>.md`.
2. Read it, pass it through `kept`, and write it as `<slug>.md`.
3. Rename `<slug>.json` to `<slug>.json.migrated` only after the write of the `.md` file.
4. Report a `.json` file that fails `kept`, and leave it where it is.

## Validation

- A folder with two `.json` records starts with two `.md` records and two `.json.migrated` files.
- A folder with both `motion.json` and `motion.md` keeps the `.md` record and leaves the `.json` file alone.
- `pnpm exec vitest run packages/bot` passes.

## Resume
