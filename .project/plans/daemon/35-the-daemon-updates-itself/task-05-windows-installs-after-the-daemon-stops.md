---
title: Windows installs after the daemon stops
status: todo
depends:
  - task-03-update-installs-moves-plugins-and-restarts.md
layer: server
refs:
  - "[code://packages/server/package.json](../../../../packages/server/package.json) - `node-pty`, the native binding Windows locks"
  - "[code://packages/server/src/install.ts#L86-L101](../../../../packages/server/src/install.ts#L86-L101) - `launch`, npm as `node npm-cli.js` on Windows"
  - "[code://packages/server/src/commands/restart.ts#L396-L418](../../../../packages/server/src/commands/restart.ts#L396-L418) - `successorTakes` and `windowsHide`"
---

## Objective

On Windows, `ahpd update` stops the daemon, installs the new version from a helper outside the install, and starts the daemon again.

## Files

- `CREATE: packages/server/src/updater.ts` - the helper: wait for a pid, run npm, move the plugins, start the daemon, write each step to a log.
- `UPDATE: packages/server/src/selfupdate.ts` - `handOffToHelper()`, which copies the built helper to a temporary folder and starts it detached.
- `UPDATE: packages/server/src/commands/update.ts` - on Windows, answer first, then hand off and go down.
- `CREATE: packages/server/test/selfupdate-windows.test.ts` - the hand-off and the helper steps, with a fake npm.

## Steps

1. Write the tests first, with a fake npm and a fake start.
2. Build `updater.ts` as a script with no import from the install place.
3. Copy the built helper to a new folder under the system temporary folder.
4. Start it with `process.execPath`, detached, with `windowsHide`, and with the temporary folder as its working folder.
5. Pass it the pid, the npm call, the target, the config folder and the recorded line.
6. Answer `{from, to, restarting: true}`, then go down through the way down of the daemon.
7. In the helper, wait for the pid to exit, with a limit of 60 seconds.
8. In the helper, run npm, then `updatePlugins('all')` with the target.
9. In the helper, start the daemon with the recorded line, as `ahpd start` does.
10. In the helper, start the old version again when npm fails, and write the npm error to the daemon log.
11. Remove the temporary folder when the helper ends.
12. Set this task and the plan row to `implemented`.

## Validation

- A test: the hand-off copies the helper out of the install place and passes the pid and the line.
- A test: the helper waits for the pid, runs npm, then starts the daemon.
- A test: a failed npm starts the old line again and writes the error to the log.
- By hand on Windows: a daemon from `ahpd start` comes back on the newer version, and `ahpd status` shows it.
- `pnpm -s build`, `pnpm -s typecheck` and the server vitest suite pass.

## Resume
