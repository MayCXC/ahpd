---
title: A signalled start stops its daemon - implemented
date: 2026-10-30
refs:
  - git://191228a9 - the change
  - "[code://packages/server/src/daemon.ts#L540-L560](../../../../packages/server/src/daemon.ts#L540-L560) - `start` stops the child a signal would otherwise leave running"
  - "[code://packages/server/test/cli.ts#L83-L105](../../../../packages/server/test/cli.ts#L83-L105) - `afterEach` stops the commands still running and the recorded daemon"
---

An `ahpd start` signalled before it writes the record stops the daemon it started.
A server test case leaves no daemon running, however it ends.

## What was built

- [`code://packages/server/src/daemon.ts`](../../../../packages/server/src/daemon.ts) - from the spawn until the record is written, `start` handles a SIGINT, SIGTERM or SIGHUP that nothing else in the process answers: the child is killed before its announcement or asked to stop after it, and the signal then ends `start`. The handlers go in a `finally`.
- [`code://packages/server/test/fixtures/plugin-slow-start/index.ts`](../../../../packages/server/test/fixtures/plugin-slow-start/index.ts) - a plugin that writes its daemon's pid to `AHPD_STARTING` and holds the start until `AHPD_RELEASE`.
- [`code://packages/server/test/cli.ts`](../../../../packages/server/test/cli.ts) - `cli` registers each command; `afterEach` asks those still running to stop and waits for them, then stops the daemon the case's record names beside the pids it already stopped.
- [`code://packages/server/test/server-cli-start.test.ts`](../../../../packages/server/test/server-cli-start.test.ts) - "stops the daemon a start made when the start is ended before the daemon says where it is".

## Verified

- The case fails against `start` before the change, with the daemon still running after its start ended by SIGTERM, and passes with it; neither run left a daemon running.
- The type check passes.

## Departures from the plan

- none.

## Left for later

- none.
