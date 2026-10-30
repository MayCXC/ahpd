---
title: The daemon restarts from a websocket command
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/update.ts#L266-L310](../../../../packages/server/src/commands/update.ts#L266-L310) - `updateMethod`, the shape to copy"
  - "[code://packages/server/src/commands/restart.ts#L696-L735](../../../../packages/server/src/commands/restart.ts#L696-L735) - the served checks of `ahpd restart`"
  - "[code://packages/server/src/commands/run.ts#L1318-L1322](../../../../packages/server/src/commands/run.ts#L1318-L1322) - the registration of `x-ahpd/update`"
---

## Objective

`x-ahpd/restart` restarts the daemon with the checks and the `force` of `ahpd restart`.
Only the host's own connection may call it.

## Files

- `UPDATE: packages/server/src/commands/restart.ts:696-735` - a `servedRestart` helper with the served checks, and `restartMethod(served)` that calls it.
- `UPDATE: packages/server/src/commands/run.ts:1318-1322` - `x-ahpd/restart` is registered beside `x-ahpd/update`.
- `CREATE: packages/server/test/host-restart-method.test.ts` - the cases below, in the shape of `host-update-method.test.ts`.
- `UPDATE: docs/server/RUN.md` - the Restart section names `x-ahpd/restart`.
- `UPDATE: docs/updates/v0_14.md` - a line for the command.

## Steps

1. Move the served branch of the command's `run` into one helper that both surfaces call.
2. Write `restartMethod(served)` with `grant: 'config:write'` and a `describe` that says "Restart the daemon".
3. Refuse a `reader`, and an owner that does not start with `root:`, with `deploymentOnly(..., 'restart the daemon')`.
4. Read `force` as `params.force === true`, and ignore every other param.
5. Answer `{ restarting: true, pid }`, and turn a conflict into an `RpcError` with its words.
6. Register `x-ahpd/restart` in `run.ts` with `by: 'ahpd'`, beside `x-ahpd/update`.
7. Name the command in the Restart section of `docs/server/RUN.md`.
8. Add a line under 0.14 in `docs/updates/v0_14.md`.

## Validation

- A root owner with no turn running gets `{ restarting: true, pid }`, and `served.restart` gets the recorded argv.
- A turn running and no `force` gives a refusal that names the session, and no restart.
- `force: true` restarts while a turn runs.
- A reader, or an owner `user:<id>`, gets the refusal from `deploymentOnly`.
- A daemon in the foreground gets `FOREGROUND`.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume

