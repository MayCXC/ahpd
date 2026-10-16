---
title: VS Code's file is imported as an automation
status: todo
depends:
  - task-01-an-automation-is-exported-as-vscodes-file.md
layer: server
refs:
  - "file:///github/externals/vscode/src/vs/sessions/contrib/sessions/browser/views/automationsView.ts#L2085-L2135 - VS Code's import"
  - "[code://packages/server/src/scheduled.ts](../../../../packages/server/src/scheduled.ts) - the store that import creates in"
---

## Objective

`ahpd automation import <file> --folder <path>` makes a switched-off automation from VS Code's `.automation.md` file.

## Files

- `UPDATE: packages/server/src/commands/automation.ts` - the `automation import` command. On HTTP it is `POST /automation/import`, with the file text in the body.
- `UPDATE: packages/server/test/blueprint.test.ts` - the cases in Validation.
- `UPDATE: docs/sdk/AUTOMATIONS.md` - a section on import.

## Steps

1. Write the tests first.
2. Parse the file with `parse` from task 01.
3. Make the automation through the store's create, with a new id and `enabled: false`.
4. Refuse without `--folder`, and refuse a folder that is not one of the daemon's paths.
5. Print the new id.
6. Run the gates, and restore `packages/sdk/test/fixtures/wire.jsonl` after the tests.
7. Set the task to `implemented`, and write the Resume section.

## Validation

- A test: the fixture imports as a switched-off automation, with its name, prompt and schedule, in the folder given.
- A test: a second import of the same file makes a second automation with another id.
- A test: import refuses no `--folder`, an outside folder, an unknown `version` and an unknown key.
- A test: the served import reads the body, and takes no path.
- Run `pnpm -s build`, `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk and server.

## Resume
