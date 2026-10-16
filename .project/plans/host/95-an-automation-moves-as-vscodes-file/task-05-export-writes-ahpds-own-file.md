---
title: Export writes ahpd's own file, and --vscode writes VS Code's
status: implemented
layer: server
refs:
  - "[code://packages/server/src/commands/automation.ts](../../../../packages/server/src/commands/automation.ts) - `automation export` and `automation import`"
  - "[code://packages/server/src/records.ts#L44-L63](../../../../packages/server/src/records.ts#L44-L63) - `recordFile` and `readRecordFile`, the store's file format"
  - "[code://packages/server/src/scheduled.ts#L295-L320](../../../../packages/server/src/scheduled.ts#L295-L320) - how the store reads one file into a definition"
  - "[code://packages/server/src/blueprint.ts](../../../../packages/server/src/blueprint.ts) - VS Code's format, which `--vscode` keeps"
  - "file:///github/externals/vscode/src/vs/workbench/contrib/chat/common/automations/automationBlueprint.ts#L211-L235 - VS Code's file accepts only daily, weekday and weekly cron, so `--vscode` keeps its refusals"
---

## Goal

`ahpd automation export <id>` writes ahpd's own `.automation.md` file, which holds every cron, the zone and every trigger.
`ahpd automation export <id> --vscode` writes VS Code's file, with the refusals of today.
`ahpd automation import <file>` reads ahpd's file, and `--vscode` reads VS Code's file.

## Files

- `UPDATE: packages/server/src/commands/automation.ts` - export and import take `--vscode`; without it they write and read the store's record file.
- `UPDATE: packages/server/src/blueprint.ts` - the header comment says this module is the `--vscode` format.
- `UPDATE: packages/server/test/blueprint.test.ts` - tests of the native round trip and of `--vscode`.
- `UPDATE: docs/sdk/AUTOMATIONS.md` - export and import describe both files.
- `UPDATE: .project/pending/vscode-checks.md` - the host/95 steps use `--vscode`.

## Steps

1. Add a `vscode` boolean input to `automation.export` and `automation.import`, on the CLI and on HTTP.
2. Keep the current code path for `--vscode`, with no change to its output or refusals.
3. Without `--vscode`, write the definition with `recordFile`, with the message text as the body.
4. Leave out `owner`, `createdAt` and `id` from the native file.
5. Keep the triggers, their zones, `misfirePolicy`, `title`, `session` and every other definition field.
6. Name the native file from the title with `createAutomationBlueprintFileName`.
7. Without `--vscode`, read the import with `readRecordFile`, as the store reads one file.
8. Refuse a file that has `schedule` and no `triggers`, with "This is a VS Code automation file. Add --vscode."
9. Give the imported automation a new id, and switch it off.
10. Replace the file's working folder with `--folder` when given.
11. Refuse the import when the file's folder is not one this host serves and `--folder` is absent.
12. Write a test: `10 * * * *`, `*/30 * * * *` and an event trigger each export and import with no change.
13. Write a test: an automation in `America/Campo_Grande` keeps that zone through the native round trip.
14. Write a test: `--vscode` gives the same text as before this task.
15. Write a test: import refuses a VS Code file without `--vscode`, with its sentence.

## Validation

- `ahpd automation export muh77ugp-1` writes a file, and import of that file makes the same schedule.
- `ahpd automation export muh77ugp-1 --vscode` gives the same refusal as before.
- The gates pass: build, typecheck, boundary, schema and vitest.
