---
title: The plan channel holds a plan
status: todo
depends: []
layer: "tasks"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L240-L268](../../../../packages/sdk/src/types/plugin.ts#L240-L268) - `PluginChannel`, its `grant` and `snapshot`"
  - "[code://packages/sdk/src/types/plugin.ts#L773](../../../../packages/sdk/src/types/plugin.ts#L773) - `registerChannel`"
  - "[code://packages/bot/src/catalogue.ts#L85-L96](../../../../packages/bot/src/catalogue.ts#L85-L96) - the bots channel, a plugin channel to copy"
---

## Objective

A client subscribes to one plan on an `x-ahpd` channel, gets the plan as its state, and then gets one action for each change.

## Files

- `CREATE: packages/tasks/src/channel.ts` - the plan channel, its snapshot and its actions.
- `UPDATE: packages/tasks/src/plugin.ts` - register the channel, and publish on each record change.
- `CREATE: packages/tasks/test/tasks-channel.test.ts` - a subscribe and the actions after it.

## Steps

1. Register the channel with the URI `x-ahpd-plans://<plan id>`.
2. Ask the grant `session:read`.
3. Answer a subscribe with the plan record and the tasks that name it.
4. Publish `plan/taskAdded` for a new task of the plan, with the task.
5. Publish `plan/taskSet` for a changed task of the plan, with the task.
6. Publish `plan/set` for a change to the plan itself.

## Validation

- `packages/tasks/test/tasks-channel.test.ts`: a subscribe gets the plan; `task_add` then publishes `plan/taskAdded`.
- `packages/tasks/test/tasks-channel.test.ts`: `task_set` publishes `plan/taskSet`; a reader without the grant cannot subscribe.
- `pnpm vitest run packages/tasks/test` passes.

## Resume
