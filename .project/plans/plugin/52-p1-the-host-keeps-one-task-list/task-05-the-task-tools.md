---
title: The task tools
status: done
depends: [task-02-tasks-and-plans-are-records.md, task-03-a-tool-call-names-its-person.md]
layer: "tasks"
refs:
  - "[code://packages/sdk/src/tools/session.ts#L124](../../../../packages/sdk/src/tools/session.ts#L124) - `filterSessions`, a list filter on a tool's input"
  - "[code://packages/bot/src/post.ts](../../../../packages/bot/src/post.ts) - a host tool that a plugin registers"
---

## Objective

A model adds a task with `task_add`, changes it with `task_set`, and lists tasks with `task_list`.
The host writes the `created`, `started` and `finished` stamps, and an unapproved task cannot start when approval is on.

## Files

- `CREATE: packages/tasks/src/tasks.ts` - the three task tools.
- `UPDATE: packages/tasks/src/plugin.ts` - register the task tools in `apply`.
- `CREATE: packages/tasks/test/tasks-tasks.test.ts` - each tool over a fake `ToolCall`.

## Steps

1. Write `task_add` with every task field as input except `id`, `source` and the stamps.
2. Set a new task to `todo`, stamp `created` with `stampOf`, and answer one line with its id.
3. Refuse a `plan` or a `blockedBy` id that names no record.
4. Write `task_set` to change the fields its input names, by task id.
5. Stamp `started` at the first `doing` only.
6. Stamp `finished` once, at the first of `review`, `done` or `dropped`.
7. Clear `active` when a task leaves `doing`.
8. Refuse `doing` for a task with no `approved` stamp when the approval setting is on.
9. Write `task_list` with the filters `status`, `approved`, `ready`, `by` and `since`.
10. Match `by` and `since` on any of the five stamps.
11. Read `ready` as `todo`, with every `blockedBy` task `done`.
12. Also require an `approved` stamp for `ready` when the approval setting is on.
13. Answer one line per task: id, status, priority and title.
14. Ask no grant in these tools, because everyone sees and may change every task for now.

## Validation

- `packages/tasks/test/tasks-tasks.test.ts`: `task_add` stamps `created`; `task_set` to `doing` stamps `started`; `done` stamps `finished`.
- `packages/tasks/test/tasks-tasks.test.ts`: with approval on, `task_set` refuses `doing` before `task_approve` and takes it after.
- `packages/tasks/test/tasks-tasks.test.ts`: one session changes a task that another session made. Each filter of `task_list` works.
- `pnpm vitest run packages/tasks/test` passes.

## Resume

- **Done so far:** every step. `tasks.ts` has `task_add`, `task_set` and `task_list`, and `apply` registers them beside the plan tools, with `requireApproval` from the settings. `task_add` takes every field except `id`, `source` and the stamps, makes the task `todo`, stamps `created` from the call and answers `t1, todo, medium, <title>`. It refuses a `plan` or a `blockedBy` id that names no record. `task_set` changes the fields its input names and refuses the same unknown plan and blockers. `started` is written at the first `doing` only, `finished` once at the first of `review`, `done` or `dropped`, and leaving `doing` deletes `active`. With approval on, `task_set` refuses `doing` for a task with no `approved` stamp. `task_list` filters on `status`, `approved`, `ready`, `by` and `since`. `by` and `since` read all five stamps, and `by` matches an owner with or without the `user:` prefix. `ready` is `todo` with every blocker `done`, approved when approval is on. The answer is one line per task, or `No tasks.`. No tool asks a grant.
- **Next action:** task 06.
- **Open questions:** step 1 says `task_add` takes every task field, and step 2 says a new task is `todo`. The two cannot both hold for `status`. Step 2 was followed: `task_add` has no `status` input, and a task starts `todo` and moves with `task_set`. Reported to Softov.
- **Watch out for:** the tools validate a name before they write, so a refused call leaves no record. `task_add` defaults `session` to the call's session, and `priority` to `medium`. A non-text `body` is refused rather than ignored. `task_list` reads the whole list and filters in memory, because a blocker's status is needed for `ready`.
