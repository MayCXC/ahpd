---
title: The automation store moves to the server, and an automation is a Markdown file
domain: host
status: active
priority: medium
created: 2026-10-10
revalidated: 2026-10-11
requires:
  - plans/plugin/45-a-plugin-keeps-records-in-the-host-store-p1-the-host-gives-a-record-store/plan.md
decisions:
  - decisions/the-automation-store-lives-in-server.md
  - decisions/yaml-lives-in-server.md
  - decisions/a-person-edits-a-record-as-a-markdown-file.md
  - decisions/an-automation-run-state-is-kept-apart.md
  - decisions/the-daemon-reloads-a-hand-edited-file.md
refs:
  - "[code://packages/sdk/src/scheduled.ts#L12-L60](../../../../packages/sdk/src/scheduled.ts#L12-L60) - `ScheduledOptions` and `Saved`, the one file and its shape"
  - "[code://packages/sdk/src/scheduled.ts#L185-L217](../../../../packages/sdk/src/scheduled.ts#L185-L217) - `save`, which writes every automation on each change"
  - "[code://packages/sdk/src/scheduled.ts#L331-L371](../../../../packages/sdk/src/scheduled.ts#L331-L371) - `load`, which reads them once, at start"
  - "[code://packages/server/src/commands/run.ts#L654-L661](../../../../packages/server/src/commands/run.ts#L654-L661) - where the daemon opens the store"
  - "[code://packages/server/src/config.ts#L389](../../../../packages/server/src/config.ts#L389) - `automationsPath`"
  - "[code://packages/sdk/src/sessions.ts#L712-L740](../../../../packages/sdk/src/sessions.ts#L712-L740) - `migrateSessions`, the pattern for the one-time conversion"
---

## Goal

`scheduledAutomations` is in `@ahpd/server`, and the sdk keeps the `AutomationStore` port and `memoryAutomations`.
Each automation is `<configDir>/automations/<id>.md`.
The frontmatter holds the definition, and the body holds the message text.
What changes on each run is in `<configDir>/automations-state.json`, so a run never rewrites a file a person edits.
The running daemon uses an edit at once.

## Reconnaissance

### Searches performed

- `rg -ln "scheduledAutomations" packages docs` - the sdk exports it, `run.ts` makes it, `docs/LIBRARY.md` shows it, and four sdk test files use it.
- `rg -n "exports|main" packages/server/package.json` - the server is a binary and exports no library.
- `rg -n "automations.json" docs packages/*/src` - `automationsPath`, `docs/AUTOMATIONS.md`, `docs/DAEMON.md` and `docs/LIBRARY.md`.

### Runtime path

```
<configDir>/automations/<id>.md + automations-state.json -> scheduledAutomations (server) -> the clock and the catalogue
scheduledAutomations save -> recordFile -> one <id>.md per changed definition, and the state file
a person edits <id>.md -> folder watch -> readRecordFile -> the clock is armed again -> ahp-automations:// subscribers
```

### Gaps

- The store is in the sdk, which has no YAML.
- The store reads its file once, at start.
- Each save writes every automation and its run state into one file.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [The scheduled automation store lives in the server](../../../decisions/the-automation-store-lives-in-server.md) | Softov, 2026-10-11 |
| 2 | [The server depends on @cofold/yaml, and the sdk does not](../../../decisions/yaml-lives-in-server.md) | Softov, 2026-10-11 |
| 3 | [A bot or an automation is one Markdown file with YAML frontmatter](../../../decisions/a-person-edits-a-record-as-a-markdown-file.md) | Softov, 2026-10-10 |
| 4 | [An automation's run state is kept apart from its file](../../../decisions/an-automation-run-state-is-kept-apart.md) | Softov, 2026-10-10 |
| 5 | [The daemon reloads a bot or an automation file that a person edits](../../../decisions/the-daemon-reloads-a-hand-edited-file.md) | Softov, 2026-10-10 |

| What | Source | Task |
| --- | --- | --- |
| The sdk tests that drive a host with `scheduledAutomations` move to `packages/server/test` | the sdk may not import the server | 01 |
| The store writes a file with `recordFile` and reads it with `readRecordFile` from plugin plan 45 p1 | one Markdown record format in the server | 02 |
| `scheduledAutomations` takes `dir` and `state`, and keeps no single-file mode | the daemon is its one caller | 02 |
| The file name is the id after `ahp-automation:/`, so a copy under a new name is a new automation | the same rule as a bot slug | 02 |
| `owner` and `createdAt` are in the frontmatter, and `runCount`, `nextRunAt`, `modifiedAt` and `customizations` are in the state file | [the run state decision](../../../decisions/an-automation-run-state-is-kept-apart.md) | 02 |
| `automations.json` is converted at start and renamed `automations.json.migrated` | `migrateSessions` | 03 |

## Proposed architecture

- **Data flow** - a file is frontmatter plus body; the store joins them with the state row into the row it loads today.
- **Event flow** - the folder watch reads one file again, and the store replaces, adds or removes one automation and arms the clock again.
- **State flow** - `scheduledAutomations` holds the truth while the daemon runs; a save writes the changed file and the state file.
- **Layer responsibilities** - `packages/sdk`: the `AutomationStore` port and `memoryAutomations` · `packages/server`: the clock, the folder, the state file, the watch, the conversion.
- **Source-of-truth files** - [`code://packages/sdk/src/scheduled.ts`](../../../../packages/sdk/src/scheduled.ts), which moves to `packages/server/src/scheduled.ts`

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The store moves to the server](task-01-the-store-moves-to-the-server.md) | implemented | - |
| [02 - The store keeps each automation as a Markdown file](task-02-the-store-keeps-markdown-files.md) | todo | 01 |
| [03 - automations.json is converted at start](task-03-the-old-file-is-converted.md) | todo | 02 |
| [04 - The store reloads a file a person edits](task-04-the-store-reloads-an-edit.md) | todo | 02 |
| [05 - The docs describe the automation file](task-05-the-docs-describe-the-file.md) | todo | 04 |

## Risks and tradeoffs

- A program that embeds the sdk loses `scheduledAutomations` - `docs/LIBRARY.md` shows `memoryAutomations` and names the change.
- The store's own write causes a watch event - the store compares the file with what it wrote last and ignores a match.
- A definition a person edits can be one the host refuses - the store reports it and keeps the old definition.

## Resume state

- **Done so far:** task 01 implemented 2026-10-11, awaiting review.
- **Next action:** review task 01. Then [task-02-the-store-keeps-markdown-files.md](task-02-the-store-keeps-markdown-files.md), after plugin plan 45 p1 gives `recordFile`.
- **Open questions:** none.
- **Watch out for:** task 02 needs `recordFile` from plugin plan 45 p1 task 02. Task 01 added `disableConditionsOf`, `parseCron`, `nextOccurrence`, `Cron` and `AutomationEntry` to the sdk exports, because the moved store imports them from `@ahpd/sdk`.

## Final verification checklist

- [ ] `pnpm -s typecheck` and `pnpm -s boundary` pass.
- [ ] `pnpm exec vitest run packages/sdk packages/server` passes.
- [ ] `rg -n "scheduledAutomations" packages/sdk` finds nothing.
- [ ] A copy of `~/.config/ahpd/automations.json` converts, and each automation lists the same before and after.
- [ ] `plans/index.md` updated.
