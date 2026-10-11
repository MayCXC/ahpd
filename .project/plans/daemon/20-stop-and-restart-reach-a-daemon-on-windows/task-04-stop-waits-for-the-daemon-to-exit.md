---
title: Stop waits for the daemon to exit
status: todo
depends: [task-03-stop-and-restart-send-through-the-pipe.md]
layer: "packages/server"
refs:
  - "[code://packages/server/src/daemon.ts#L436-L444](../../../../packages/server/src/daemon.ts#L436-L444) - `stop`"
  - "[code://packages/server/src/commands/stop.ts](../../../../packages/server/src/commands/stop.ts) - the `Stopped` line"
---

## Objective

On every platform, `ahpd stop` waits until the process exits, kills it after `STOP_WAIT_MS`, and prints `Stopped` only for a process that is gone.

## Files

- `UPDATE: packages/server/src/daemon.ts:436-444` - `stop` becomes async, waits, kills, and then forgets.
- `UPDATE: packages/server/src/commands/stop.ts` - await `stop`, print the kill line, and change the description.
- `UPDATE: packages/server/test/daemon.test.ts` - cases for the wait and the kill.

## Steps

1. Add `STOP_WAIT_MS = 30_000` to `daemon.ts`.
2. Give `stop` the steps it needs as a parameter, as `AtTerminal` does, so a test drives the clock.
3. After `deliver`, check `alive(pid)` every 100 ms until it is false or the time ends.
4. When the time ends, send `SIGKILL`, and wait for the exit again.
5. Forget the record only after the process is gone.
6. Answer `stopped` or `killed`.
7. Print `Killed <url> (pid <n>): it did not stop within 30 seconds.` for a kill.
8. Keep the `Stopped <url> (pid <n>).` line for a stop.
9. Change the description to `Asks the process the record names to stop, waits for it, and forgets where it was.`.

## Validation

- `daemon.test.ts` stops a process that exits after two checks, and the record goes after the exit.
- `stop` kills a process that never exits after the limit, and answers `killed`.
- The `Stopped` line and the `{"stopped":false}` answer do not change.
- `pnpm -s typecheck` and `pnpm exec vitest run packages/server` pass.

## Resume
