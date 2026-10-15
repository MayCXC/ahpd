---
title: The docs describe the automation file
status: implemented
depends: [task-04-the-store-reloads-an-edit.md]
layer: "docs"
refs:
  - "[code://docs/sdk/AUTOMATIONS.md#L191](../../../../docs/sdk/AUTOMATIONS.md#L191) - the `automations` option, which names `automations.json`"
  - "[code://docs/server/REFERENCE.md](../../../../docs/server/REFERENCE.md) - the same option"
---

## Objective

A person knows where an automation file is, what it holds, and that the daemon uses an edit at once.

## Files

- `UPDATE: docs/sdk/AUTOMATIONS.md` - a section on the file, with an example, and the option row.
- `UPDATE: docs/server/REFERENCE.md` - the option names the folder.
- `UPDATE: docs/sdk/LIBRARY.md` - the library page names the file too, in the sentence about the daemon's clock store, and the validation below is about every mention.

## Steps

1. Write that an automation is `<configDir>/automations/<id>.md`, and what the state file holds.
2. Show an example file, with frontmatter and the message as the body.
3. Write that a copy of the file under a new name installs a new automation.
4. Change the option rows in `AUTOMATIONS.md` and `DAEMON.md` to name the folder.

## Validation

- `rg -n "automations.json" docs` finds only the line about the conversion.

## Resume

Implemented 2026-10-11. `docs/sdk/AUTOMATIONS.md` has a new `## Where an automation is kept` between Configuration and Commands: the file is `<configDir>/automations/<id>.md`, named after the id, which is a slug for that reason; the frontmatter is the definition and the body is the message a run is given, with a full example; the copy that installs a second automation; what a run changes living in `<configDir>/automations-state.json` instead of the file; the running daemon reading a file the moment it changes, with a file it will not run reported and the old definition kept; and the one-time conversion, with `automations.json.migrated` beside it. The `automations` option row now names that section instead of `automations.json`, and `docs/server/REFERENCE.md` says every definition is a Markdown file under `automations/`, with a link to the section. `docs/sdk/LIBRARY.md` said the same thing about the daemon's clock store in its `automations` section, which the validation below is about, so the sentence there names the folder too.

`rg -n "automations.json" docs` finds one line: the conversion sentence in the new section. Files changed, uncommitted:

- `UPDATE: docs/sdk/AUTOMATIONS.md` - the section, and the option row.
- `UPDATE: docs/server/REFERENCE.md` - the `--automations` passage.
- `UPDATE: docs/sdk/LIBRARY.md` - the clock store's sentence in the `automations` section.

Nothing but prose: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server --maxWorkers=2 --testTimeout=10000` pass - 188 files, 3678 cases.
