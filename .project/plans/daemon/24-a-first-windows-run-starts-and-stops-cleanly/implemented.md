---
title: A first Windows run starts and stops cleanly - implemented
date: 2026-10-13
refs:
  - git://6768d19f - the last commit of the plan
  - "[code://packages/server/src/commands/configure.ts](../../../../packages/server/src/commands/configure.ts)"
  - "[code://packages/server/src/commands/restart.ts](../../../../packages/server/src/commands/restart.ts)"
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts)"
  - "[code://packages/server/src/daemon.ts](../../../../packages/server/src/daemon.ts)"
---

A first run on Windows now configures, starts and stops with no manual step. `ahpd configure` makes its folder, a stop removes `daemon.json` and logs `stopping` and `stopped`, and a start logs each stage and waits a minute.

## What was built

- [`code://packages/server/src/commands/configure.ts`](../../../../packages/server/src/commands/configure.ts) - makes the token's folder before it writes the token.
- [`code://packages/server/src/commands/restart.ts`](../../../../packages/server/src/commands/restart.ts) - `lifecycle.shutdown` logs `stopping` and `stopped`, and forgets the record in both arms.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - five `start:` lines, one before each start stage.
- [`code://packages/server/src/daemon.ts`](../../../../packages/server/src/daemon.ts) - `READY_TIMEOUT_MS` is 60 s.

## Verified

- On Linux: typecheck, boundary and schema exit 0, and vitest on the four packages passes 242 files and 4364 tests.
- On Windows, by Softov on 2026-10-13, from a build of ahpd main:
  - `ahpd configure` runs to the end on a fresh folder.
  - A start logs each stage. The first cold start took 26 s from `listen` to `listening`, which is why the old 20 s wait failed.
  - `ahpd stop` and a shutdown request each log `stopping` and then `stopped`, and each removes the record.
  - `ahpd restart` works.

## Departures from the plan

- Tasks 02 and 03 are one commit, because they change the same lines of `restart.ts`.
- Task 04 changed one comment in `restart.ts`, and task 03 changed `shutdown-method.test.ts`. The plan did not name either file.

## Left for later

- `--connection-token-file` with a folder that does not exist still fails. ahp-desk has a workaround.
