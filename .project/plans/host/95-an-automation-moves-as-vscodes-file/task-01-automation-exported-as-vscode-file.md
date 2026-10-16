---
title: An automation is exported as VS Code's file
status: implemented
depends: []
layer: server
refs:
  - "file:///github/externals/vscode/src/vs/workbench/contrib/chat/common/automations/automationBlueprint.ts - the format and VS Code's serializer"
  - "[code://packages/server/src/commands/teams.ts](../../../../packages/server/src/commands/teams.ts) - the command group to mirror"
---

## Objective

`ahpd automation export <id>` prints an automation as VS Code's `.automation.md` text, or writes it to `--out`.

## Files

- `CREATE: packages/server/src/blueprint.ts` - the format: `serialize` from a store entry, and `parse` to a blueprint, with VS Code's rules.
- `CREATE: packages/server/src/commands/automation.ts` - the `automation export` command, on the CLI and on HTTP as `GET /automation/export/{id}`.
- `UPDATE: packages/server/src/commands/registry.ts` - declare the new group.
- `CREATE: packages/server/test/blueprint.test.ts` - the cases in Validation.
- `UPDATE: docs/sdk/AUTOMATIONS.md` - a section on export.

## Steps

1. Read VS Code's `automationBlueprint.ts`, and copy its rules into `blueprint.ts`.
2. Copy `.scratch/review-yesterday-s-commits.automation.md` to a test fixture.
3. Write the tests first.
4. Write `serialize`, with a refusal sentence for each case the format cannot hold.
5. Write `parse`, which task 02 uses, and which the tests use to check an export.
6. Declare the command, and mirror the shape of `teams.ts`.
7. Run the gates, and restore `packages/sdk/test/fixtures/wire.jsonl` after the tests.
8. Set the task to `implemented`, and write the Resume section.

## Validation

- A test: daily, weekdays, weekly, hourly and manual automations each export, and `parse` reads each back.
- A test: the fixture parses, and `serialize` of the result gives the same text.
- A test: export refuses a webhook trigger, two schedules, `*/5 * * * *` and another zone, each with a sentence.
- A test: the exported file has no key but `version`, `id`, `name`, `description` and `schedule`.
- Run `pnpm -s build`, `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk and server.

## Resume

- **Done so far:** built 2026-10-16. `packages/server/src/blueprint.ts` holds VS Code's parser and serializer rule for rule, with VS Code's names and refusal sentences. `ahpd automation export <id>` prints the file or writes it to `--out`, and `GET /api/automation/export/{id}` answers `{ id, fileName, text }`. The served store is the daemon's own, through a new `automations()` on `ServedFacts`.
- **Next action:** build task 02.
- **Open questions:** none.
- **Watch out for:** these choices were not in the plan:
  - Export also refuses an hourly cron off the hour, such as `30 * * * *`. VS Code's `kind: hourly` holds no minute and would drop it.
  - Export also refuses `misfirePolicy: skip`. VS Code always writes `runOnce`.
  - A schedule with no `timeZone` counts as UTC, as the store reads it.
  - The file's `id` and file name come from the title, as VS Code's export makes them. No `description` is written, as in VS Code.
  - At a terminal, export opens the store in `<configDir>/automations` for the one command and closes it after.
  - The grant is `automation:list`, the grant that already lets a caller read the catalogue.
