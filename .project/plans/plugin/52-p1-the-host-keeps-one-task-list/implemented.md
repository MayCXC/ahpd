---
title: The host keeps one task list - implemented
date: 2026-10-19
refs:
  - git://af889920
  - "[code://packages/tasks/src/plugin.ts](../../../../packages/tasks/src/plugin.ts) - the `tasks` plugin, its two settings and the ten tools it registers"
  - "[code://packages/tasks/src/record.ts](../../../../packages/tasks/src/record.ts) - the task and plan records and their checks"
  - "[code://packages/sdk/src/types/host.ts](../../../../packages/sdk/src/types/host.ts) - `ToolCall.person()`"
---

The host keeps one list of tasks and plans in the `@ahpd/tasks` plugin.
Every session reads and writes it with host tools, and the host writes each stamp from the caller.
Approval before a start and the sweep of finished plans are settings, and both are off by default.

## What was built

- [`code://packages/tasks/src/plugin.ts`](../../../../packages/tasks/src/plugin.ts) - the plugin with the id `tasks`, the settings `requireApproval` and `sweepAfterDays`, and the registration of the ten tools. It runs one tool call at a time, so two calls cannot take one id.
- [`code://packages/tasks/src/record.ts`](../../../../packages/tasks/src/record.ts) - `TaskRecord`, `PlanRecord`, `Stamp`, the status lists and the check of each record.
- [`code://packages/tasks/src/store.ts`](../../../../packages/tasks/src/store.ts) - the `tasks` and `plans` collections, the ids `t<n>` and `p<n>`, and the sweep. The sweep counts from the newest stamp of the plan and of its tasks.
- [`code://packages/tasks/src/stamp.ts`](../../../../packages/tasks/src/stamp.ts) - `stampOf`, which writes `at`, `by` and `in` from the call.
- [`code://packages/tasks/src/plans.ts`](../../../../packages/tasks/src/plans.ts) - `plan_create`, `plan_set`, `plan_show` and `plan_list`. A plan gets `finished` at its first move to `done` or `dropped`.
- [`code://packages/tasks/src/tasks.ts`](../../../../packages/tasks/src/tasks.ts) - `task_add`, `task_set` and `task_list`, with the `started` and `finished` stamps and the `ready` filter.
- [`code://packages/tasks/src/approve.ts`](../../../../packages/tasks/src/approve.ts) - `plan_approve` and `task_approve` behind `task:approve`, and `task_review` with no grant.
- [`code://packages/sdk/src/types/host.ts`](../../../../packages/sdk/src/types/host.ts) and [`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts) - `ToolCall.person()`: the sender of the running turn, else the session owner, else `host`.
- [`code://docs/plugins/TASK-LIST.md`](../../../../docs/plugins/TASK-LIST.md) - the fields, the statuses, the stamps, the ten tools, the grant and the settings. `docs/plugins/tasks.md` includes the package README.

## Verified

- `packages/tasks/test/tasks-plugin.test.ts`: `has approval off and keeps every plan when it is given nothing` and `takes a value that is set`.
- `packages/tasks/test/tasks-record.test.ts`: each status and priority, a bad status, a two-line `note`, and a verdict only on `reviewed`.
- `packages/tasks/test/tasks-store.test.ts`: the body and goal read back, the ids count up, `find` by plan, and the sweep off and on.
- `packages/sdk/test/host-tools.test.ts`: `names the person behind a call, the session owner when no turn runs, and the host when neither`.
- `packages/tasks/test/tasks-plans.test.ts`: `stamps the caller's person and session, and ignores a stamp in the input`, and the `plan_set`, `plan_show` and `plan_list` cases.
- `packages/tasks/test/tasks-tasks.test.ts`: the stamps, the approval refusal and each filter of `task_list`.
- `packages/tasks/test/tasks-approve.test.ts`: `refuses a person without the grant, in the host's words, and writes nothing` and `refuses a call no person is behind`.
- `packages/tasks/test/tasks-harnesses.test.ts`: the ten tools through pi and cofold, and `lists from a second session the task a first session added`.
- `packages/tasks/test/tasks-docs.test.ts`: `shows a task record the store reads without a problem`.
- Softov reviewed tasks 01 to 08 on 2026-10-19.

## Departures from the plan

- Ten tools, not nine: `plan_set` came from Softov's answer of 2026-10-18. The tests and `TASK-LIST.md` name ten.
- `task_add` has no `status` input, because task 05 step 2 makes a new task `todo`. Step 1 said every field.
- The reference page is `docs/plugins/TASK-LIST.md`, not `TASKS.md`, because `TASKS.md` and `tasks.md` clash on a file system that ignores case.
- `packages/tasks` has `@cofold/agents` as a devDependency for the cofold half of `tasks-harnesses.test.ts`.
- The checklist line on a Claude session is not ticked here. This plan proves pi and cofold, and p12 adds Claude and ACP.

## Left for later

- Claude and ACP write the list in [p12](../52-p12-claude-and-acp-write-the-task-list/plan.md), and a client sees it in [p13](../52-p13-a-client-sees-the-task-list/plan.md).
- Who may see and change a task is "everyone, for now". A later plan refines it.
