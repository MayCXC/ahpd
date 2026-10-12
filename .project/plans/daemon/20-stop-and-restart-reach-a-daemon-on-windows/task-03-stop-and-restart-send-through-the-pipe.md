---
title: Stop and restart send through the pipe on Windows
status: implemented
depends: [task-02-the-daemon-answers-a-request-on-its-pipe.md]
layer: "packages/server"
refs:
  - "[code://packages/server/src/daemon.ts#L436-L444](../../../../packages/server/src/daemon.ts#L436-L444) - `stop`"
  - "[code://packages/server/src/commands/restart.ts#L403-L425](../../../../packages/server/src/commands/restart.ts#L403-L425) - `realTerminal` and `unsignalled`"
---

## Objective

`deliver(record, signal)` sends a request to the record's pipe on win32, and a signal elsewhere, and `stop` and `ahpd restart` use it.

## Files

- `UPDATE: packages/server/src/daemon.ts:436-444` - `deliver`, and `stop` sends through it.
- `UPDATE: packages/server/src/commands/restart.ts:403-418` - `realTerminal.signal` sends through `deliver`.
- `UPDATE: packages/server/test/control.test.ts` - cases for `deliver`.

## Steps

1. Write `deliver(record, signal, platform)` in `daemon.ts`.
2. On win32 with `record.control`, connect to `control.pipe` and write the request line.
3. Otherwise, call `process.kill(record.pid, signal)` as today.
4. Throw an error with code `ESRCH` when the pipe does not exist.
5. On win32 with no `control`, say that an older ahpd started it and to stop it by hand.
6. Change `AtTerminal.signal` to take the record, and make `realTerminal.signal` call `deliver`.
7. Make `restartAtTerminal` pass the record to `signal`.

## Validation

- `control.test.ts` delivers to a control server over a unix socket path with `platform` set to win32.
- A pipe that does not exist gives the `unsignalled` words for a daemon that is gone.
- On linux, `deliver` sends the signal even when the record has `control`.
- `pnpm -s typecheck` and `pnpm exec vitest run packages/server` pass.

## Resume

- **Status:** implemented, and not committed. The files this task changed are `packages/server/src/daemon.ts`, `packages/server/src/commands/restart.ts`, `packages/server/src/commands/stop.ts`, `packages/server/test/control.test.ts`, `packages/server/test/daemon.test.ts` and `packages/server/test/server-restart.test.ts`.
- **Done:** `deliver(record, signal, platform)` sends a signal on any platform but win32, and on win32 sends `requestLine(control, signal)` to `record.control.pipe`.
  A record on win32 with no `control` is refused in words that name an older ahpd and say to stop the pid by hand.
  A pipe that is not there, and one nothing listens on, both reject with `code: 'ESRCH'`.
  That is what `unsignalled` words as a daemon that is gone.
  `requestLine` and `ControlledSignal` are in `daemon.ts`, beside `Control`, so the listener and the sender share one format.
  `stop` is async and awaits `deliver`, and swallows a gone process still.
  It throws anything else, so a record no request reaches is not printed as `Stopped`.
  `AtTerminal.signal` takes the record, `realTerminal.signal` calls `deliver`, and `restartAtTerminal` awaits it.
- **Verified:** `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/server` pass, 941 cases in 48 files.
  Six cases are new in `control.test.ts` for `deliver`, including the win32 path over a unix socket path and the terminal's words for a gone daemon.
  The two `ESRCH` cases were seen to fail with the code mapped to `ENOENT` and pass with it back.
- **Note:** `stop` had to become async here, one task before task 04, because `deliver` is. `stop.ts` awaits it already; task 04 adds the wait, the kill and the new description.
- **Left by hand:** the Windows half, that a named pipe is what the connect reaches.
- **Next action:** task 04, the wait in `stop` and the `Killed` line.
