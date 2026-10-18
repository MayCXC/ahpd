---
title: The docs say how the list works
status: implemented
depends: [task-06-approving-and-reviewing-take-a-grant.md]
layer: "docs"
refs:
  - "[code://docs/plugins/BOTS.md](../../../../docs/plugins/BOTS.md) - a plugin's docs page, the shape to copy"
  - "[code://packages/bot/test/bot-docs.test.ts](../../../../packages/bot/test/bot-docs.test.ts) - a test that keeps a docs page true"
---

## Objective

`docs/plugins/TASK-LIST.md` says what a task and a plan hold, what each tool does, which grant approving takes, and what the two settings do.

## Files

- `CREATE: docs/plugins/TASK-LIST.md` - the task and plan fields, the statuses, the stamps, the nine tools, the grant and the settings.
- `UPDATE: packages/tasks/README.md` - the install line and a link to `TASK-LIST.md`.
- `CREATE: packages/tasks/test/tasks-docs.test.ts` - the record the page shows is read as the store reads it.

## Steps

1. List the task fields and the plan fields, with each status.
2. Say that the host writes each stamp from the caller, and that a model writes none.
3. Give one line for each tool, with its inputs.
4. Name the approve grant and show a role that holds it.
5. Show the two settings and their defaults in a configuration sample.
6. Say that everyone sees and may change every task, for now.

## Validation

- `packages/tasks/test/tasks-docs.test.ts` passes.
- The docs match the code of tasks 01 to 06.

## Resume

- **Done so far:** every step. `docs/plugins/TASK-LIST.md` lists the task and plan fields, the task, plan and priority statuses, the five stamps and the three a plan has. It gives one line for each of the ten tools with its inputs, and the `task:approve` grant with a role that holds it. It shows the two settings with a configuration sample, and says that everyone sees and may change every task for now. `docs/plugins/tasks.md` includes the package README and links the page, and `docs/.vitepress/config.mts` lists both. The README already carried the install line and the link to `TASK-LIST.md`, so it did not change. `tasks-docs.test.ts` reads the task record the page shows with `readRecordFile`, and puts it in a memory store. It reads it back through `taskStore` with no problem line.
- **Next action:** none; all eight tasks are implemented. The final report is to Softov.
- **Open questions:** the task says nine tools; there are ten since `plan_set`, and the page says ten.
- **Watch out for:** `tasks-docs.test.ts` imports `readRecordFile` from `packages/server/src/records.ts`, as the bot docs test does. The record sample is the page's own, so a field the store starts refusing is a failing test rather than a stale page.
