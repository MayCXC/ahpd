---
title: An automation is exported as VS Code's file
status: todo
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
