---
title: Update installs, moves the plugins and restarts
status: todo
depends:
  - task-02-update-checks-and-refuses.md
layer: server
refs:
  - "[code://packages/server/src/install.ts#L235-L260](../../../../packages/server/src/install.ts#L235-L260) - `fittingVersion`"
  - "[code://packages/server/src/install.ts#L700-L712](../../../../packages/server/src/install.ts#L700-L712) - `updatePlugins`, which refuses an unfit plugin unless `force`"
  - "[code://packages/server/src/commands/restart.ts#L396-L418](../../../../packages/server/src/commands/restart.ts#L396-L418) - `successorTakes`"
  - "[code://packages/server/src/commands/restart.ts#L206-L232](../../../../packages/server/src/commands/restart.ts#L206-L232) - `restartUnderManager`"
  - "[code://packages/server/src/commands/run.ts#L1328-L1346](../../../../packages/server/src/commands/run.ts#L1328-L1346) - `checkedRestart` as the daemon wires it"
---

## Objective

On Linux and macOS, `ahpd update` installs the new `@ahpd/server`, moves every plugin to its SDK, checks the new binary and restarts the daemon.

## Files

- `UPDATE: packages/server/src/selfupdate.ts` - `installServer()`, the plugin check and the plugin move.
- `UPDATE: packages/server/src/commands/update.ts` - the install, the answer and the restart.
- `UPDATE: packages/server/src/commands/run.ts:1328-1346` - a supervised daemon checks the successor with its own argv when the update asks.
- `UPDATE: packages/server/test/server-update.test.ts` - the install and restart cases, with a fake npm.

## Steps

1. Write the tests first, with a fake npm and a fake restart.
2. Before the install, call `fittingVersion` with the target for each registry plugin.
3. Refuse a plugin with no fitting version, unless `force`, with the words of `noFit`.
4. Run `npm install -g --prefix <prefix> @ahpd/server@<to>` for a global place.
5. Add `--allow-scripts=node-pty` to a global install on npm 11.16 or later, as daemon/27 does.
6. Run `npm install --prefix <dir> @ahpd/server@<to>` for a prefix place.
7. Run `updatePlugins('all')` with the target as the version, so `@ahpd/sdk` moves too.
8. Run `successorTakes` on the recorded line, or on this process's argv when a manager holds the daemon.
9. Refuse with the npm or the check error, and keep the old daemon running.
10. Answer `{from, to, restarting: true}`, with the plugins moved and the plugins left.
11. Send the answer, then restart as `daemon.restart` does.
12. Set this task and the plan row to `implemented`.

## Validation

- A test: a global place runs npm with `-g --prefix`, and a prefix place runs it with `--prefix` only.
- A test: an unfit plugin refuses before npm runs, and `--force` names it and goes on.
- A test: a failed npm answers the error and asks for no restart.
- A test: a failed successor check answers the error and asks for no restart.
- A test: a daemon under a fake manager restarts through the manager after the answer.
- By hand on Debian: a daemon from `ahpd start` on an older version comes back on the newer one.
- `pnpm -s build`, `pnpm -s typecheck` and the server vitest suite pass.

## Resume
