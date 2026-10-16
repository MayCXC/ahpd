---
title: VS Code's file is imported as an automation
status: implemented
depends:
  - task-01-automation-exported-as-vscode-file.md
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

- **Done so far:** built 2026-10-16. `ahpd automation import <file> --folder <path>` parses the file with `parseAutomationBlueprint`, and creates `ahp-automation:/<uuid>` with `enabled: false`, the name as `title`, the prompt as `message.text` with origin `automation`, the folder as `session.workingDirectories`, and VS Code's schedule trigger in this host's zone. `POST /api/automation/import` takes `text` and `folder` in the body, and no path.
- **Next action:** review.
- **Open questions:** none.
- **Watch out for:** these choices were not in the plan:
  - A folder under one of the daemon's paths is accepted, as `ahpd paths add` treats one as served. Over HTTP the folder must be absolute.
  - At a terminal, the served folders are the ones the configuration names, or the current folder when it names none.
  - No `provider` is set, so a run uses the host default.
  - The file's `id` and `description` are dropped: an AHP definition has no field for them.
  - The owner of a served import is the person who sent it, or `root:<hostname>` for the deployment token, as the protocol's create names it. A terminal import and a host with no users directory name no owner.
  - At a terminal, import opens the store in `<configDir>/automations` for the one command and closes it after. A running daemon picks the new file up through its watch on the folder. Both write the state file, so a run state the daemon writes at the same moment can be lost.
  - Over `--remote`, the served command takes `--text`, not a file path.
  - The grant is `automation:create`, the grant of the protocol's create.
