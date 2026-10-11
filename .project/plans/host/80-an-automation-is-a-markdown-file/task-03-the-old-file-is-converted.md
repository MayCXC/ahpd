---
title: automations.json is converted at start
status: todo
depends: [task-02-the-store-keeps-markdown-files.md]
layer: "packages/server"
refs:
  - "[code://packages/sdk/src/sessions.ts#L712-L740](../../../../packages/sdk/src/sessions.ts#L712-L740) - `migrateSessions`, the pattern"
---

## Objective

A daemon that starts with `automations.json` has one `.md` file per automation and a state file, and every automation lists the same as before.

## Files

- `UPDATE: packages/server/src/scheduled.ts` - `migrateAutomations`.
- `UPDATE: packages/server/src/commands/run.ts` - call it before the store opens, as `migrateSessions` is called.
- `UPDATE: packages/server/test/automation-files.test.ts` - cases for the conversion.

## Steps

1. Add `migrateAutomations({ file, dir, state, onProblem })`, beside `migrateSessions`.
2. Read `automations.json` when it exists and the folder has no `.md` file.
3. Write each row as its `.md` file and its state row.
4. Rename `automations.json` to `automations.json.migrated` only after every row has its file.
5. Report a file of a version the store does not know, and leave it where it is.

## Validation

- A copy of a `version: 1` file with three automations converts to three `.md` files and one state file.
- `runCount` and `nextRunAt` survive the conversion.
- `pnpm exec vitest run packages/server` passes.

## Resume
