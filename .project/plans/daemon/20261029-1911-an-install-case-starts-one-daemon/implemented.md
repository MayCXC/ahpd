---
title: An install case starts one daemon - implemented
date: 2026-10-29
refs:
  - git://6af41b29 - the change
  - "[code://packages/server/test/fixtures/systemctl-fake/systemctl](../../../../packages/server/test/fixtures/systemctl-fake/systemctl) - the calls that act"
  - "[code://packages/server/test/server-cli-service.test.ts](../../../../packages/server/test/server-cli-service.test.ts) - the case that counts the daemons an install starts"
---

The stand-in systemctl of the command-line cases does a case's action only on a call that starts or stops a unit, as systemctl does.
An install starts its daemon once, on `enable --now`, so no second daemon of the same configuration home runs past the case.

## What was built

- [`code://packages/server/test/fixtures/systemctl-fake/systemctl`](../../../../packages/server/test/fixtures/systemctl-fake/systemctl) - `SYSTEMCTL_DO` runs on `start`, `stop`, `restart` and a call with `--now`, and on no other call.
- [`code://packages/server/test/server-cli-service.test.ts`](../../../../packages/server/test/server-cli-service.test.ts) - a case that counts the daemons one install starts.

## Verified

- Without the fix, the case fails: the stand-in started two daemons for one install, and one of them was still running after the case.
- With it, `server-cli-service.test.ts` and `server-cli-restart.test.ts` pass, 19 of 19, in four runs. No daemon was left running after any of them.
- `pnpm -s typecheck` exits 0.
- Vitest on `packages/server` at one worker: 1635 pass and 2 skip, and no daemon was left running after it.
- Before the fix, eight installs of the plain service through the stand-in, run alone, left a second daemon running after one of them.

## Departures from the plan

- none.

## Left for later

- none.
