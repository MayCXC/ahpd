---
title: An automation moves as VS Code's file
domain: host
status: planned
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

`ahpd automation export <id>` writes an automation as VS Code's `.automation.md` file.
`ahpd automation import <file>` makes an automation from one.
A file then moves between VS Code, ahpd, ahpc and ahpw without VS Code's window.

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
| Export writes `timeZone: local` when the zone is the host's zone, and refuses another zone | (defaulted: the format allows only `local`) | 01 |
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

## Risks and tradeoffs

- VS Code can change the format. The parser refuses an unknown `version`, as VS Code does.
- A served import takes the file text in the body, not a path, so a request cannot read a file on the host.

## Resume state

- **Done so far:** planned 2026-10-15. Task 01 implemented 2026-10-16: `blueprint.ts` and `ahpd automation export`. Task 02 implemented 2026-10-16: `ahpd automation import`.
- **Next action:** review both tasks.
- **Open questions:** none.
- **Watch out for:** VS Code refuses a file with any key it does not know, so export writes no key of ahpd's own.

## Final verification checklist

- [ ] A test: an exported file parses with VS Code's rules, as the fixture `.scratch/review-yesterday-s-commits.automation.md` does.
- [ ] A test: export refuses each case the format cannot hold, with its sentence.
- [ ] A test: import of the fixture makes a switched-off automation in the folder given.
- [ ] The gates pass: build, typecheck, boundary, schema and vitest.
- [ ] By hand: a file exported by ahpd imports in VS Code, and a file exported by VS Code imports in ahpd.
- [ ] `docs/sdk/AUTOMATIONS.md` and `plans/index.md` updated.
