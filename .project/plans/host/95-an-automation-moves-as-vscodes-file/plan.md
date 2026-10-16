---
title: An automation moves as VS Code's file
domain: host
status: active
priority: medium
created: 2026-10-15
revalidated: 2026-10-15
refs:
  - "file:///github/externals/vscode/src/vs/workbench/contrib/chat/common/automations/automationBlueprint.ts - the format: `version: 1`, `id`, `name`, `description`, `schedule` and the prompt as the body"
  - "file:///github/externals/vscode/src/vs/sessions/contrib/sessions/browser/views/automationsView.ts#L2085-L2135 - VS Code's import: a new automation, switched off, with the name, prompt and schedule"
  - "[code://packages/server/src/scheduled.ts](../../../../packages/server/src/scheduled.ts) - the file store and its record shape"
  - "[code://packages/server/src/commands/teams.ts](../../../../packages/server/src/commands/teams.ts) - a command group to mirror"
  - "[code://packages/server/src/config.ts#L488](../../../../packages/server/src/config.ts#L488) - `automationsDir`"
  - "[code://docs/sdk/AUTOMATIONS.md](../../../../docs/sdk/AUTOMATIONS.md) - the automations doc"
---

## Goal

`ahpd automation export <id>` writes an automation as ahpd's own `.automation.md` file, with every cron, zone and trigger.
`ahpd automation export <id> --vscode` writes it as VS Code's file.
`ahpd automation import <file>` makes an automation from either file, with `--vscode` for VS Code's.
A file then moves between hosts, and between VS Code and ahpd, without VS Code's window.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `ls packages/server/src/commands` - no `automation` command group.
- `rg -n "parseAutomationBlueprint" vscode/src/vs/sessions` - one import and one export site in `automationsView.ts`.

### What VS Code's format allows

- Keys: `version` (1), `id` (at most 64 characters), `name`, `description` and `schedule`. Any other key is refused.
- `schedule.kind`: `manual`, `hourly` or `cron`.
- A `cron` schedule has `timeZone: local`, and its expression is daily, weekdays or weekly: `M H * * *`, `M H * * 1-5` or `M H * * D`.
- `hourly` has no minute.
- Each cron field is a plain number: `10 * * * *` and `*/30 * * * *` are refused (`fromCronExpression`).
- VS Code's own export refuses its `custom` interval, which is a cron from an agent host.
- The body is the prompt, and it is required.

### Gaps

- ahpd has no command that reads or writes this format.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Export and import are `ahpd automation` commands in the server's registry, on the CLI and on HTTP | Softov, 2026-10-15, asked where they live and chose "ahpd command" | 01, 02 |
| The store file keeps its shape, because VS Code refuses a file with a key it does not know | Softov, 2026-10-15, asked how to handle the format and chose "Add export and import" | 01 |
| The output is VS Code's format exactly, and VS Code's import reads it | Softov, 2026-10-15, "export and import automations from/to vscode with less parsing" | 01 |
| Export refuses an automation the format cannot hold, with a sentence that names what: a webhook or event trigger, more than one schedule, or a cron the format does not allow | (defaulted: VS Code's own export refuses a schedule it cannot carry) | 01 |
| Export writes `timeZone: local` for every zone and keeps the hour, because the file moves to a computer whose zone is not known | Softov, 2026-10-16, asked "When an automation's zone differs from the host's, what does export write?" and chose "Write local, keep the hour" | 03 |
| `ahpd automation list` shows each automation's id, name, folder, schedule and whether it is on | Softov, 2026-10-16, chose "automation list" for "The CLI has automation export and import but no way to see the ids. What do we add?" | 04 |
| Export writes ahpd's own file by default, and `--vscode` writes VS Code's file with the refusals of task 01 | Softov, 2026-10-16, said "its a vscode export not a export", asked what export should be, and chose "Native default, --vscode flag" | 05 |
| ahpd's own file is the store's record file, without `owner`, `createdAt` and `id` | (defaulted: the store already keeps each automation as this Markdown file) | 05 |
| Import of ahpd's file keeps the file's folder when this host serves it, and `--folder` replaces it | (defaulted: the native file holds the folder) | 05 |
| Export of an automation with no schedule writes `kind: manual` | (defaulted: VS Code's mapping) | 01 |
| Import makes a new id, and the automation is switched off, as VS Code's import does | VS Code's `automationsView.ts` | 02 |
| Import takes the folder from `--folder`, and refuses without one | (defaulted: the file holds no folder) | 02 |
| Import reads `local` as the host's zone | (defaulted: the file says "local") | 02 |

## Proposed architecture

- **Data flow** - export reads the store entry and writes the file text. Import parses the text and calls the store's create.
- **Layer responsibilities** - server: the format module and the two commands. sdk: no change.
- **Source-of-truth files** - `packages/server/src/blueprint.ts`, a new module with `parse` and `serialize`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An automation is exported as VS Code's file](task-01-automation-exported-as-vscode-file.md) | implemented | - |
| [02 - VS Code's file is imported as an automation](task-02-vscode-file-imported-as-an-automation.md) | implemented | 01 |
| [03 - Export writes local for every zone](task-03-export-writes-local-for-every-zone.md) | implemented | 01 |
| [04 - The CLI lists the automations](task-04-the-cli-lists-the-automations.md) | implemented | - |
| [05 - Export writes ahpd's own file, and --vscode writes VS Code's](task-05-export-writes-ahpds-own-file.md) | implemented | 01, 02 |

## Risks and tradeoffs

- VS Code can change the format. The parser refuses an unknown `version`, as VS Code does.
- A served import takes the file text in the body, not a path, so a request cannot read a file on the host.

## Resume state

- **Done so far:** planned 2026-10-15. Task 01 implemented 2026-10-16: `blueprint.ts` and `ahpd automation export`. Task 02 implemented 2026-10-16: `ahpd automation import`. Both reviewed 2026-10-16. Tasks 03 and 04 implemented and reviewed 2026-10-16, merged in `b600db07`. Task 05 implemented 2026-10-16: export and import read and write the store's file, and `--vscode` keeps VS Code's.
- **Next action:** the check by hand in VS Code, in `pending/vscode-checks.md`.
- **Open questions:** none.
- **Watch out for:** VS Code refuses a file with any key it does not know, so export writes no key of ahpd's own.

## Final verification checklist

- [ ] A test: an exported file parses with VS Code's rules, as the fixture `.scratch/review-yesterday-s-commits.automation.md` does.
- [ ] A test: export refuses each case the format cannot hold, with its sentence.
- [ ] A test: export of an automation in another zone writes `timeZone: local` and the same hour.
- [ ] A test: `ahpd automation list` shows each automation, and `--json` gives the same rows.
- [ ] A test: `10 * * * *`, `*/30 * * * *`, an event trigger and a zone survive the native round trip.
- [ ] A test: import of the fixture makes a switched-off automation in the folder given.
- [ ] The gates pass: build, typecheck, boundary, schema and vitest.
- [ ] By hand: a file exported by ahpd imports in VS Code, and a file exported by VS Code imports in ahpd.
- [ ] `docs/sdk/AUTOMATIONS.md` and `plans/index.md` updated.
