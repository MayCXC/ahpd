---
title: The store keeps each automation as a Markdown file
status: implemented
depends: [task-01-the-store-moves-to-the-server.md]
layer: "packages/server"
refs:
  - "[code://packages/sdk/src/scheduled.ts#L36-L60](../../../../packages/sdk/src/scheduled.ts#L36-L60) - `Saved`, the row, in the server after task 01"
  - "[code://packages/server/src/commands/run.ts#L650-L661](../../../../packages/server/src/commands/run.ts#L650-L661) - where the daemon opens the store"
---

## Objective

`scheduledAutomations` keeps each automation as `<dir>/<id>.md`, and the run state of all of them in one state file.

## Files

- `UPDATE: packages/server/src/scheduled.ts` - the `dir` and `state` options, and the folder read and write.
- `UPDATE: packages/server/src/config.ts` - `automationsDir` and `automationStatePath`.
- `UPDATE: packages/server/src/commands/run.ts` - pass the folder and the state file.
- `CREATE: packages/server/test/automation-files.test.ts` - cases for the file shape.

## Steps

1. Replace `file` in `ScheduledOptions` with `dir` and `state`.
2. Name each file for the id after `ahp-automation:/`, and refuse an id that is not a safe file name.
3. Write each file with `recordFile`: the definition, `owner` and `createdAt` as frontmatter, and `message.text` as the body.
4. Read each file with `readRecordFile`.
5. Write `runCount`, `nextRunAt`, `modifiedAt` and `customizations` of every automation to the state file.
6. On a save, write only the files whose definition changed, and remove the file of a deleted automation.
7. On a load, join each file with its state row; a file with no row has no run state.
8. Remove a state row whose file is gone at the next save.
9. Keep each file and the state file at mode `0600`.

## Validation

- `automation-files.test.ts` saves an automation with a multi-line message, loads it, and gets the same row.
- The file on disk has the message as plain text below the frontmatter.
- A run changes the state file and leaves the `.md` file as it was.
- A file copied under a new name loads as a second automation with no run state.
- `pnpm exec vitest run packages/server` passes.

## Resume

Implemented 2026-10-11. `ScheduledOptions` is now `{ dir, state, now?, timer?, onProblem? }`: `dir` is the folder of `<id>.md` files and `state` is the one `automations-state.json` the run state of all of them is in. `save` writes a file only when the text this store last computed for it changed, and removes the file of an automation that is gone; `load` joins each file with its state row and leaves a file with no row without one. `recordFile` takes the body field name, so the file is flat with a `message.text` key that `recordFile` turns into the body, and any other field of the message stays as a `message:` mapping in the frontmatter. The frontmatter carries the definition, `owner` and `createdAt`, and an `id` a person wrote is dropped on read, because the file name is the id. `runCount`, `nextRunAt`, `modifiedAt` and `customizations` go in the state file, which `writeJsonAtomic` writes at `0600` as the `.md` files are. `run.ts` passes `automationsDir()` and `automationStatePath()`, and `wholeFiles` lists the state file where `automations.json` was, so `daemon.test.ts` names `automationStatePath()` too. `packages/server/test/automation-files.test.ts` is new; `scheduled.test.ts` was rewritten for the two paths and the folder. `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server` pass - 188 files, 3667 cases.

`automation-files.test.ts` is new, and `git add` is denied in this session, so the file could not be staged: this task's commit carries the tracked files only, and the new one is still untracked on disk. It goes in with `git add` and `git commit --amend --no-edit` once staging is allowed - the question is in the plan's Resume state.

One thing task 03 inherits: this daemon no longer writes `automations.json` whole, so `wholeFiles` no longer names it and a `<automations.json>.<pid>.tmp` an earlier daemon left is not swept. Nothing reads it and the conversion renames `automations.json` itself, so it is harmless.
