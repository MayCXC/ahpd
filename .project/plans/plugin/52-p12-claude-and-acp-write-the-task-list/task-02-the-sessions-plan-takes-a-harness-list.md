---
title: The session's plan takes a harness list
status: todo
depends: [task-01-a-backend-hands-its-list-to-the-host.md]
layer: "tasks"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L919](../../../../packages/sdk/src/types/plugin.ts#L919) - `on`, how the tasks plugin hears the event"
  - npm://@agentclientprotocol/sdk@^1.8.0 - `PlanEntry`, the statuses and priorities a whole list carries
---

## Objective

A harness list writes the tasks of the session's plan, and the plan stays across turns.
A whole list matches by text, a missing step is dropped, and a clear after every step is complete drops nothing.

## Files

- `CREATE: packages/tasks/src/translate.ts` - the session's plan, the text match, and a change by the harness's id.
- `UPDATE: packages/tasks/src/record.ts` - the third scope `session`, with the session id as text.
- `UPDATE: packages/tasks/src/plugin.ts` - hear the event of task 01 in `apply`.
- `CREATE: packages/tasks/test/tasks-translate.test.ts` - each kind of list and change.

## Steps

1. Find the session's plan, or make it on the first list, with the scope `session`.
2. Map `pending` to `todo`, `in_progress` to `doing`, `completed` to `done` and `deleted` to `dropped`.
3. Match each entry of a whole list to the first unmatched task with the same text.
4. Add a task for an entry that matches none, with `source` set to the tool and no harness id.
5. Set each task of the plan that the list does not hold to `dropped`, and keep its record.
6. Drop nothing when the list is empty and every task of the plan is `done`.
7. Find the task of a single change by the harness's id in `source`, or add it.
8. Keep the `priority` of an entry on its task.
9. Write `by` on the stamps with the sender of the turn.

## Validation

- `packages/tasks/test/tasks-translate.test.ts`: a first list makes the plan; a second list in another turn writes the same plan.
- `packages/tasks/test/tasks-translate.test.ts`: a step missing from the next list reads `dropped`, and its record stays.
- `packages/tasks/test/tasks-translate.test.ts`: an empty list after every step is `done` drops nothing.
- `packages/tasks/test/tasks-translate.test.ts`: a change by harness id updates its task, and `source` keeps the id.
- `pnpm vitest run packages/tasks/test` passes.

## Resume
