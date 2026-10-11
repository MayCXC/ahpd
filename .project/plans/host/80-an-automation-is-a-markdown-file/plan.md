---
title: An automation is a Markdown file, and the daemon reloads one a person edits
domain: host
status: planned
priority: medium
created: 2026-10-10
revalidated: 2026-10-10
decisions:
  - decisions/the-sdk-re-exports-yaml.md
  - decisions/a-person-edits-a-record-as-a-markdown-file.md
  - decisions/an-automation-run-state-is-kept-apart.md
  - decisions/the-daemon-reloads-a-hand-edited-file.md
refs:
  - "[code://packages/sdk/src/scheduled.ts#L12-L60](../../../../packages/sdk/src/scheduled.ts#L12-L60) - `ScheduledOptions` and `Saved`, the one file and its shape"
  - "[code://packages/sdk/src/scheduled.ts#L185-L217](../../../../packages/sdk/src/scheduled.ts#L185-L217) - `save`, which writes every automation on each change"
  - "[code://packages/sdk/src/scheduled.ts#L331-L371](../../../../packages/sdk/src/scheduled.ts#L331-L371) - `load`, which reads them once, at start"
  - "[code://packages/server/src/commands/run.ts#L650-L661](../../../../packages/server/src/commands/run.ts#L650-L661) - where the daemon opens the store"
  - "[code://packages/server/src/config.ts#L389](../../../../packages/server/src/config.ts#L389) - `automationsPath`"
  - "[code://packages/sdk/src/sessions.ts#L712-L740](../../../../packages/sdk/src/sessions.ts#L712-L740) - `migrateSessions`, the pattern for the one-time conversion"
  - npm://@cofold/yaml@^0.3.0 - `parseYaml`, and `stringifyYaml` from cofold plan commands/05
---

## Goal

Each automation is `<configDir>/automations/<id>.md`.
The frontmatter holds the definition, and the body holds the message text.
A person reads, edits, copies or installs one automation as one file, and the running daemon uses an edit at once.
What changes on each run is in `<configDir>/automations-state.json`, so a run never rewrites a file a person edits.

## Reconnaissance

### Searches performed

- `rg -n "automations.json" docs packages/*/src` - `automationsPath`, `docs/AUTOMATIONS.md`, `docs/DAEMON.md` and `docs/LIBRARY.md`.
- `rg -n "dependencies" packages/sdk/package.json` - the sdk depends on the protocol package only, until task 01.

### Runtime path

```
<configDir>/automations/<id>.md + automations-state.json -> scheduledAutomations (sdk) -> the clock and the catalogue
scheduledAutomations save -> one <id>.md per changed definition, and the state file
a person edits <id>.md -> folder watch -> scheduledAutomations reload -> the clock is armed again -> ahp-automations:// subscribers
```

### Gaps

- The store reads its file once, at start.
- Each save writes every automation and its run state into one file.
- The sdk has no YAML parser.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A bot or an automation is one Markdown file with YAML frontmatter](../../../decisions/a-person-edits-a-record-as-a-markdown-file.md) | Softov, 2026-10-10 |
| 2 | [An automation's run state is kept apart from its file](../../../decisions/an-automation-run-state-is-kept-apart.md) | Softov, 2026-10-10 |
| 3 | [The daemon reloads a bot or an automation file that a person edits](../../../decisions/the-daemon-reloads-a-hand-edited-file.md) | Softov, 2026-10-10 |
| 4 | [The sdk depends on @cofold/yaml and re-exports it](../../../decisions/the-sdk-re-exports-yaml.md) | Softov, 2026-10-11 |

| What | Source | Task |
| --- | --- | --- |
| `scheduledAutomations` takes `dir` and keeps the folder, and `file` names the old file it converts | the folder replaces the file | 02 |
| The file name is the id after `ahp-automation:/`, so a copy under a new name is a new automation | the same rule as a bot slug | 02 |
| `owner` and `createdAt` are in the frontmatter, and `runCount`, `nextRunAt`, `modifiedAt` and `customizations` are in the state file | [the run state decision](../../../decisions/an-automation-run-state-is-kept-apart.md) | 02 |
| `automations.json` is converted at start and renamed `automations.json.migrated` | `migrateSessions` | 03 |

## Proposed architecture

- **Data flow** - a file is frontmatter plus body; the store joins them with the state row into the row it loads today.
- **Event flow** - the folder watch reads one file again, and `scheduledAutomations` replaces, adds or removes one automation and arms the clock again.
- **State flow** - `scheduledAutomations` holds the truth while the daemon runs; a save writes the changed file and the state file.
- **Layer responsibilities** - `packages/sdk`: the YAML re-export, the clock, the catalogue, the folder, the state file, the watch, the conversion · `packages/server`: the paths it passes.
- **Source-of-truth files** - [`code://packages/sdk/src/scheduled.ts`](../../../../packages/sdk/src/scheduled.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The sdk re-exports YAML](task-01-the-sdk-re-exports-yaml.md) | todo | - |
| [02 - The store keeps each automation as a Markdown file](task-02-the-store-keeps-markdown-files.md) | todo | 01 |
| [03 - automations.json is converted at start](task-03-the-old-file-is-converted.md) | todo | 02 |
| [04 - The store reloads a file a person edits](task-04-the-store-reloads-an-edit.md) | todo | 02 |
| [05 - The docs describe the automation file](task-05-the-docs-describe-the-file.md) | todo | 04 |

## Risks and tradeoffs

- The store's own write causes a watch event - the store compares the file with what it wrote last and ignores a match.
- A definition a person edits can be one the host refuses - it is reported, and the store keeps the old definition.
- The plan needs a published `@cofold/yaml` with `stringifyYaml` - cofold plan commands/05 comes first.

## Resume state

- **Done so far:** nothing.
- **Next action:** cofold plan commands/05, then [task-01-the-sdk-re-exports-yaml.md](task-01-the-sdk-re-exports-yaml.md).
- **Open questions:** none.
- **Watch out for:** `docs/LIBRARY.md` shows `scheduledAutomations({ file })`, and a program that passes only `file` must still start.

## Final verification checklist

- [ ] `pnpm -s typecheck` and `pnpm -s boundary` pass.
- [ ] `pnpm exec vitest run packages/sdk packages/server` passes.
- [ ] A copy of `~/.config/ahpd/automations.json` converts, and each automation lists the same before and after.
- [ ] `plans/index.md` updated.
