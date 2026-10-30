---
title: A start stops the daemon it made when it is signalled
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/daemon.ts#L537-L595](../../../../packages/server/src/daemon.ts#L537-L595) - `start`"
  - "[code://packages/server/test/cli.ts#L81-L94](../../../../packages/server/test/cli.ts#L81-L94) - `afterEach`"
---

## Objective

`start` stops its daemon when it is signalled before the record names it, and `afterEach` leaves no
command and no recorded daemon running.

## Files

- `UPDATE: packages/server/src/daemon.ts` - `start` handles SIGINT, SIGTERM and SIGHUP that nothing
  else answers, from the spawn until the record is written: the child is killed before its
  announcement or asked to stop after it, and the signal then ends `start`.
- `CREATE: packages/server/test/fixtures/plugin-slow-start/` - a plugin that writes its daemon's pid
  to the file `AHPD_STARTING` names and holds the start until the file `AHPD_RELEASE` names exists.
- `UPDATE: packages/server/test/cli.ts` - `cli` registers each command; `afterEach` asks those still
  running to stop and waits for them, and stops the daemon the case's record names; `SLOW_START`.
- `UPDATE: packages/server/test/server-cli-start.test.ts` - a `start` ended by SIGTERM while its
  daemon starts leaves no daemon running.

## Steps

1. The handlers in `start`.
2. The fixture and the case.
3. `afterEach`.

## Validation

- `pnpm run typecheck` is clean.
- The case fails on `start` before this, with the daemon left running, and passes after.
- The server suite passes and leaves no `packages/server/src/main.ts` process running.

## Resume

Done 2026-10-30.
The server suite runs once on the union.
