---
title: Tasks and plans are records
status: implemented
depends: [task-01-the-tasks-package-has-its-settings.md]
layer: "tasks"
refs:
  - "[code://packages/sdk/src/types/records.ts#L31-L49](../../../../packages/sdk/src/types/records.ts#L31-L49) - `CollectionOptions`, whose `body` keeps the long text as the Markdown body"
  - "[code://packages/sdk/src/types/plugin.ts#L692](../../../../packages/sdk/src/types/plugin.ts#L692) - `PluginHost.records`"
  - "[code://packages/bot/src/record.ts](../../../../packages/bot/src/record.ts) - a record type and its check, the shape to copy"
  - "[code://packages/bot/src/store.ts](../../../../packages/bot/src/store.ts) - a store over a record collection"
---

## Objective

A task and a plan are records in the host's record store, each kept as a Markdown file with its long text as the body.
A record that fails its check is refused on write and skipped on read, and a finished plan is swept when the setting is on.

## Files

- `CREATE: packages/tasks/src/record.ts` - `TaskRecord`, `PlanRecord`, `Stamp`, the status lists and the checks of each record.
- `CREATE: packages/tasks/src/store.ts` - the store over the `tasks` and `plans` collections, the next id, and the sweep.
- `UPDATE: packages/tasks/src/plugin.ts` - open the two collections in `apply` and start the sweep when it is on.
- `CREATE: packages/tasks/test/tasks-record.test.ts` - the checks of each field.
- `CREATE: packages/tasks/test/tasks-store.test.ts` - the store over `memoryRecords`, and the sweep.

## Steps

1. Declare `Stamp` as `{ at, by, in }`, with an optional `verdict` of `approved` or `changes` on `reviewed` only.
2. Declare the task statuses `todo`, `doing`, `blocked`, `review`, `done` and `dropped`.
3. Declare `TaskRecord` with `id`, `title`, `status`, `priority`, `labels`, `topic`, `plan`, `bot`, `folder` and `session`.
4. Give `priority` the values `high`, `medium` and `low`, with the default `medium`.
5. Add `blockedBy`, `active`, `note`, `refs`, `source`, `body` and the five stamps to `TaskRecord`.
6. Keep `folder` and `session` as text, so a removed session leaves a valid task.
7. Declare the plan statuses `draft`, `active`, `done` and `dropped`.
8. Declare `PlanRecord` with `id`, `scope`, `title`, `goal`, `status`, `refs` and the stamps `created`, `approved` and `reviewed`.
9. Give `scope` two forms, a folder and a bot, and keep no task list on a plan.
10. Write a check for each record that refuses an unknown status and an `active` or `note` with a line break.
11. Open `tasks` with `{ body: 'body' }` and `plans` with `{ body: 'goal' }`.
12. Give a new record the next id, `t<n>` for a task and `p<n>` for a plan.
13. Find the tasks of a plan with `find({ plan })`.
14. With the sweep on, remove each `done` or `dropped` plan whose last stamp is older than the setting.
15. Remove the tasks that name a swept plan, with the plan.

## Validation

- `packages/tasks/test/tasks-record.test.ts`: each status, a bad status, a two-line `note`, a stamp with a `verdict` on `created`.
- `packages/tasks/test/tasks-store.test.ts`: a read gives back the body of a task and a plan. Ids count up. `find` gives a plan's tasks.
- `packages/tasks/test/tasks-store.test.ts`: the sweep off keeps a `done` plan; the sweep on removes an old one and keeps an `active` one.
- `pnpm vitest run packages/tasks/test` passes.

## Resume

- **Done so far:** every step. `record.ts` declares `Stamp`, the six task statuses, three priorities with `medium` as the default, the four plan statuses and the two scope forms. It declares `TaskRecord`, `PlanRecord`, and `checkTask`/`checkPlan`. The checks refuse an unknown status or priority, a two-line `active` or `note` and a bad scope. They also refuse a verdict on a stamp that is not `reviewed`, and an id that is not `t<n>`/`p<n>`. `store.ts` keeps the two collections, validates on read and write, counts ids up per collection, and finds a plan's tasks with `find({ plan })`. It sweeps a `done` or `dropped` plan whose newest stamp is older than the setting, and the tasks that name it go with it. `apply` opens `tasks` with `{ body: 'body' }` and `plans` with `{ body: 'goal' }`, and starts an hourly, unref'd and stoppable sweep when the setting is on.
- **Next action:** task 03.
- **Open questions:** none.
- **Watch out for:** a record store's `find` compares fields with `===`, so a plan's object scope cannot be matched there; `plan_list` filters plans in memory. `source` is `{ tool, id? }`, matching the p12 rows ("the tool and the harness's own id"). The sweep reads the newest of `created`, `approved` and `reviewed`, and a stamp whose `at` does not parse is skipped.
