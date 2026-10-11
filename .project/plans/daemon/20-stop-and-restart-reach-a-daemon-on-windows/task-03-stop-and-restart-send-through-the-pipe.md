---
title: Stop and restart send through the pipe on Windows
status: todo
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
