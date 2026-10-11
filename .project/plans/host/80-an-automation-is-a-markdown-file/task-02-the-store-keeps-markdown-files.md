---
title: The store keeps each automation as a Markdown file
status: todo
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
