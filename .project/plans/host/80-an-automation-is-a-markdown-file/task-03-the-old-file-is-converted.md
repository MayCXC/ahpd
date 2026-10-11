---
title: automations.json is converted at start
status: implemented
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

Implemented 2026-10-11. `migrateAutomations({ file, dir, state, onProblem })` is at the end of `packages/server/src/scheduled.ts`, and `run.ts` calls it through a new `daemonAutomations(told)` beside `daemonSessions(told)`, before the store opens. It returns without reading anything when the folder already holds a `.md` file, is silent when there is no file, and reports and leaves a file whose `version` is not 1. Each row becomes `<dir>/<id>.md` written the way the store writes one, with its run state as a row of the state file, and the file is renamed `automations.json.migrated` only after every row has its `.md`. A row whose resource is not an id this host can keep a file for is left behind with a word about it, as `migrateSessions` skips a row with no id.

The `idOf`, `fileIn`, `textAt`, `wrote`, `idsIn` and `textOf` helpers moved out of the `scheduledAutomations` closure to module scope, so the conversion and the store write an automation's file the same way rather than each having its own answer.

Files changed, uncommitted:

- `UPDATE: packages/server/src/scheduled.ts` - `migrateAutomations` and `AutomationMigrationOptions`, and the hoisted file helpers.
- `UPDATE: packages/server/src/commands/run.ts` - `daemonAutomations`, and `automationsPath` and `AutomationStore` imported for it.
- `UPDATE: packages/server/test/automation-files.test.ts` - four cases: three rows become three files and a state file, `runCount` and `nextRunAt` survive, an unknown version is left alone, and a folder that already holds an automation is left alone.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server` pass - 188 files, 3671 cases.
