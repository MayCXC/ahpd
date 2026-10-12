---
title: "`ahpd stop` and `ahpd restart` reach a daemon on Windows - implemented"
date: 2026-10-11
refs:
  - git://0ac2c07
  - "[code://packages/server/src/control.ts](../../../../packages/server/src/control.ts)"
  - "[code://packages/server/src/daemon.ts](../../../../packages/server/src/daemon.ts)"
---

On Windows, `ahpd stop` and `ahpd restart` reach a detached daemon through a named pipe with a key. The daemon then runs the shutdown or restart that a Unix signal runs. On every platform, `ahpd stop` prints `Stopped` only after the process is gone, and kills it after 30 seconds.

## What was built

- [`code://packages/server/src/control.ts`](../../../../packages/server/src/control.ts) - `controlServer`, which answers one JSON line per connection after a `timingSafeEqual` key check.
- [`code://packages/server/src/daemon.ts`](../../../../packages/server/src/daemon.ts) - `control` on `Running`, `controlFor`, `deliver`, and `stop`, which waits, kills and then forgets.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - the child reads `AHPD_CONTROL` and starts the control server in a detached daemon.
- [`code://packages/server/src/commands/restart.ts`](../../../../packages/server/src/commands/restart.ts) - `realTerminal.signal` sends through `deliver`.
- [`code://docs/DAEMON.md`](../../../../docs/DAEMON.md) - the pipe, the key and the wait.

## Verified

- `pnpm exec vitest run packages/server`: 48 files, 946 tests pass, with `control.test.ts` new.
- `pnpm -s typecheck` and `pnpm -s boundary` pass on main after the merge.

## Departures from the plan

- The row "a pipe that does not answer reads as the `ESRCH` case" - `stop` now asks the process table first. A daemon still alive after its pipe did not answer is an error, and its record is kept. The review added this, with a test, because a silent pipe on a live daemon would otherwise forget a running process.

## Left for later

- The two checks by hand on Windows in the plan's final list - they need Softov's Windows machine.
