---
title: The automation store moves to the server, and an automation is a Markdown file
domain: host
status: built
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
| The file name is the id after `ahp-automation:/`, so a copy under a new name is a new automation | a bot file is named by its slug the same way | 02 |
| An automation id is lowercase letters, digits and hyphens, starts with a letter or a digit, and has at most 64 characters | Softov, 2026-10-11, to "How should the id rule go?" - "Allow a leading digit" | 06 |
| `RESERVED_COLLECTIONS` names `automations`, so a plugin cannot open the daemon's automation folder, and `bots` stays open for the bot plugin | Softov, 2026-10-11, to "What should be reserved?" - "Only automations" | 06 |
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
| [01 - The store moves to the server](task-01-the-store-moves-to-the-server.md) | done | - |
| [02 - The store keeps each automation as a Markdown file](task-02-the-store-keeps-markdown-files.md) | implemented | 01 |
| [03 - automations.json is converted at start](task-03-the-old-file-is-converted.md) | implemented | 02 |
| [04 - The store reloads a file a person edits](task-04-the-store-reloads-an-edit.md) | implemented | 02 |
| [05 - The docs describe the automation file](task-05-the-docs-describe-the-file.md) | implemented | 04 |
| [06 - A UUID id is kept, and the automation folder is reserved](task-06-a-uuid-id-is-kept.md) | implemented | 05 |

## Risks and tradeoffs

- A program that embeds the sdk loses `scheduledAutomations` - `docs/LIBRARY.md` shows `memoryAutomations` and names the change.
- The store's own write causes a watch event - the store compares the file with what it wrote last and ignores a match.
- A definition a person edits can be one the host refuses - the store reports it and keeps the old definition.

## Resume state

- **Done so far:** all six tasks are implemented, committed as `1b2b493` and `4e3756e`, and released in 0.11.0. See [implemented.md](implemented.md).
- **Next action:** Softov reviews tasks 02 to 06; then each task is `done`.
- **Open questions:** none.
- **Watch out for:** the store is now `{ dir, state }` and no caller passes a single file. `wholeFiles` in `run.ts` names `automationStatePath()` rather than `automationsPath()`, so an old `automations.json` and its scratch are not swept. `recordFile` takes a top-level body field name, which is why the file carries a flat `message.text` key rather than a nested one. The folder is watched, so a test that leaves a store open across a temporary folder sees events from the store's own writes; the `known` map is what tells them apart. A definition read from a file is applied as a whole definition rather than as a patch, and the stamp is set before the change so the file keeps the `createdAt` it was written with. The automation folder is `<configDir>/automations`, the same shape as a plugin's record collection, so `RESERVED_COLLECTIONS` names `automations` and a plugin cannot open it - while `bots` stays open, because the bot plugin opens that collection through the same store, which is why a bot's id is still a record slug and an automation's is not. An automation's id is a file name and nothing more, so the rule is `^[a-z0-9][a-z0-9-]{0,63}$` rather than the record store's slug.

## Final verification checklist

- [x] `pnpm -s typecheck` and `pnpm -s boundary` pass - run after task 06, the last code change.
- [x] `pnpm exec vitest run packages/sdk packages/server --maxWorkers=2 --testTimeout=10000` passes - 188 files, 3680 cases.
- [x] `rg -n "scheduledAutomations" packages/sdk` finds nothing.
- [x] Every automation in `~/.config/ahpd/automations.json` is one this host can keep, so each converts and lists the same: the file is version 1 with three rows, and the ids `muh77ugp-1`, `mv2rbl3j-1` and `6106470a-395a-42c1-b85c-fa26299d296f` all match the rule of task 06, the last one being the UUID the open question was about. Read rather than run - the file is Softov's own, and a `version: 1` row of that shape is what the cases in `packages/server/test/automation-files.test.ts` convert, the UUID row and the `owner` and `runCount` rows among them. A daemon started on it is the run itself: it writes the `.md` files and leaves `automations.json.migrated` beside them.
- [x] `rg -n "automations.json" docs` finds one line: the conversion sentence in the new section.
- [x] `plans/index.md` updated.
