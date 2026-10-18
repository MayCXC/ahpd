---
title: The plan tools
status: implemented
depends: [task-02-tasks-and-plans-are-records.md, task-03-a-tool-call-names-its-person.md]
layer: "tasks"
refs:
  - "[code://packages/sdk/src/tools/session.ts#L443-L500](../../../../packages/sdk/src/tools/session.ts#L443-L500) - `create_session`, a host tool to copy the pattern of"
  - "[code://packages/bot/src/post.ts](../../../../packages/bot/src/post.ts) - a host tool that a plugin registers"
---

## Objective

A model makes a plan with `plan_create`, changes one with `plan_set`, reads one with `plan_show`, and lists them with `plan_list`.
A plan belongs to its folder or bot and outlives the session that made it.

## Files

- `CREATE: packages/tasks/src/stamp.ts` - `stampOf(at)`, which writes `{ at, by, in }` from a `ToolCall`.
- `CREATE: packages/tasks/src/plans.ts` - the four plan tools.
- `UPDATE: packages/tasks/src/plugin.ts` - register the plan tools in `apply`.
- `CREATE: packages/tasks/test/tasks-plans.test.ts` - each tool over a fake `ToolCall`.

## Steps

1. Write `stampOf` to take `at` from the clock, `by` from `at.person()` and `in` from `at.session`.
2. Write `plan_create` with the inputs `title`, `goal`, `scope` and `refs`, and with no stamp input.
3. Set a new plan to `draft`, stamp `created`, and answer one line with its id.
4. Refuse a `scope` that names neither a folder nor a bot.
5. Write `plan_set` to change the `title` and the `status` its input names, by plan id.
6. Refuse a status that is not a plan status, and answer one line.
7. Write `plan_show` to answer the plan and the tasks that name it, one line per task.
8. Write `plan_list` to answer one line per plan, with a filter on `scope` and `status`.
9. Ask no grant in these tools, because everyone sees and may change every plan for now.
10. Register the four tools in `apply`.

## Validation

- `packages/tasks/test/tasks-plans.test.ts`: `plan_create` stamps the caller's person and session. A stamp in the input has no effect.
- `packages/tasks/test/tasks-plans.test.ts`: `plan_set` changes the title and the status, and refuses an unknown status.
- `packages/tasks/test/tasks-plans.test.ts`: `plan_show` lists the plan's tasks; `plan_list` filters on scope and status; each answer is one line per item.
- `pnpm vitest run packages/tasks/test` passes.

## Resume

- **Done so far:** every step. `stamp.ts` writes `{ at, by, in }` from the clock, `at.person()` and `at.session`. `plans.ts` has `plan_create`, `plan_set`, `plan_show` and `plan_list`, registered from `apply`. `plan_create` takes `title`, `goal`, `scope` and `refs`, starts the plan `draft`, ignores a stamp in the input and answers `p1, draft, <title>`. A bad scope is refused with the two shapes spelled out. `plan_set` changes `title` and `status` and refuses an unknown status or plan. `plan_show` answers the plan and one line per task. `plan_list` filters on `scope` and `status` in memory, because a record store's `find` cannot match an object scope. No tool asks a grant.
- **Next action:** task 05.
- **Open questions:** none.
- **Watch out for:** `scopeOf`, `isPlanStatus`, `planLine` and `taskLine` are in `record.ts`; `taskLine` is there so the task tools answer in the same shape. The answer for an empty list is `No plans.`. A refusal is an `RpcError` with `-32602`, which reaches the model as the tool's failure.
