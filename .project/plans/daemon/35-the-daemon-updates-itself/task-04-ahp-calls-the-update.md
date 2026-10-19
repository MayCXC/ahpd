---
title: AHP calls the update
status: todo
depends:
  - task-03-update-installs-moves-plugins-and-restarts.md
layer: server
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L333-L364](../../../../packages/sdk/src/types/plugin.ts#L333-L364) - `PluginMethod`"
  - "[code://packages/server/src/commands/run.ts#L928-L932](../../../../packages/server/src/commands/run.ts#L928-L932) - `base.methods`, where the usage methods are served"
  - "[code://packages/server/src/commands/scopes.ts#L35-L45](../../../../packages/server/src/commands/scopes.ts#L35-L45) - the deployment token check over HTTP"
---

## Objective

A client sends `x-ahpd/update` with `{version?, check?, force?}` and gets the same answer as `POST /api/update`.

## Files

- `UPDATE: packages/server/src/commands/update.ts` - `updateMethod()`, a `PluginMethod` that calls the same steps as the command.
- `UPDATE: packages/server/src/commands/run.ts:928-932` - add `x-ahpd/update` to `base.methods`, by `ahpd`.
- `CREATE: packages/server/test/host-update-method.test.ts` - the method through a scenario client.

## Steps

1. Write the tests first.
2. Give the method the grant `config:write`.
3. Refuse with an `RpcError` any owner that does not start with `root:`, with the words `deploymentOnly` gives.
4. Call the steps of task 03 with the params, in `oneAtATime`.
5. Answer the same result as the command, and restart after the answer.
6. Set this task and the plan row to `implemented`.

## Validation

- A test: the method refuses a signed-in person, and the refusal names the deployment token.
- A test: the root connection gets `{current, latest, may}` for `check`.
- A test: the root connection gets `{from, to, restarting: true}`, and the fake restart runs.
- `pnpm -s build`, `pnpm -s typecheck` and the server vitest suite pass.

## Resume
