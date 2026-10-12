---
title: Stop waits for the daemon to exit
status: implemented
depends: [task-03-stop-and-restart-send-through-the-pipe.md]
layer: "packages/server"
refs:
  - "[code://packages/server/src/daemon.ts#L641-L672](../../../../packages/server/src/daemon.ts#L641-L672) - `stop`, which waits, kills and then forgets"
  - "[code://packages/server/src/daemon.ts#L589-L599](../../../../packages/server/src/daemon.ts#L589-L599) - `STOP_WAIT_MS` and `StopSteps`"
  - "[code://packages/server/src/commands/stop.ts](../../../../packages/server/src/commands/stop.ts) - the `Stopped` and `Killed` lines"
---

## Objective

On every platform, `ahpd stop` waits until the process exits, kills it after `STOP_WAIT_MS`, and prints `Stopped` only for a process that is gone.

## Files

- `UPDATE: packages/server/src/daemon.ts:589-672` - `STOP_WAIT_MS`, the stop's steps, and `stop`, which waits, kills, and then forgets.
- `UPDATE: packages/server/src/commands/stop.ts` - the record the answer holds, the kill line, and the description.
- `UPDATE: packages/server/test/daemon.test.ts` - cases for the wait and the kill.
- `UPDATE: packages/server/test/server-cli-restart.test.ts:185-213` - the slow-stop case, which the wait changed.

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

- **Status:** implemented, and not committed. The files this task changed are `packages/server/src/daemon.ts`, `packages/server/src/commands/stop.ts`, `packages/server/test/daemon.test.ts` and `packages/server/test/server-cli-restart.test.ts`.
- **Done:** `stop(steps)` asks the daemon to stop, waits for its pid to go, and forgets the record only then.
  The wait looks at the process table every `STOP_POLL_MS` (100 ms) until `STOP_WAIT_MS` (30 seconds) ends, using the clock the steps carry.
  A daemon still there at the limit is given `SIGKILL` and waited for again, and it answers `{ record, killed }`.
  `SIGKILL` goes through `process.kill` rather than `deliver`, because it is not a request a daemon can answer.
  A process that went between the read and the request is not waited on, and answers `killed: false`.
  `stop.ts` prints `Killed <url> (pid <n>): it did not stop within 30 seconds.`, with the number taken from the constant, or `Stopped <url> (pid <n>).` for a process that went.
  Its `--json` value gained `killed`, because the two lines are rendered from it.
- **Changed to fit:** the slow-stop case in `server-cli-restart.test.ts` wrote the release file after `ahpd stop` returned, which the new wait cannot finish.
  It now writes the file from a timer set before the stop.
  The stop therefore lands inside the `stopping` handler and waits that handler out, and the case asserts `Stopped` as well.
- **Verified:** `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/server` pass, 945 cases in 48 files, four of them new.
  The wait case uses a real child and checks that the record was on disk at every look while the process was there.
  The kill case uses a real child that takes `SIGTERM` and does nothing, a real `SIGKILL`, and a 300 ms limit.
  Both mutations were seen to fail.
  `forget` before the wait fails the wait case, and a `killed` that is never set fails the two kill cases.
- **Left by hand:** the Windows half, that the `Killed` line and a stop of a daemon on a pipe behave the same there.
  The `Killed` line itself is not covered at the command line.
  Only a wait of the full 30 seconds renders it, and the one fixture that holds a shutdown caps at 30 seconds itself.
- **Next action:** task 05, the docs for stop and restart on Windows.
