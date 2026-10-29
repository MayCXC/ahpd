---
title: The wait and the cases give a slow start room
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/test/daemon-backend.test.ts#L35-L60](../../../../packages/server/test/daemon-backend.test.ts#L35-L60) - `run` and its wait"
  - "[code://packages/server/test/cli.ts#L173](../../../../packages/server/test/cli.ts#L173) - the harness's wait"
  - "[code://vitest.config.ts#L25-L34](../../../../vitest.config.ts#L25-L34) - the suite's timeout"
---

## Objective

`run` waits 15000 ms for its daemon to end before it stops it, and every case in the file may take 60000 ms.

## Files

- `UPDATE: packages/server/test/daemon-backend.test.ts:57` - wait 15000 ms.
- `UPDATE: packages/server/test/daemon-backend.test.ts:62-145` - give each case 60000 ms.

## Steps

1. Wait 15000 ms in `run`, the wait `cli.ts` gives a daemon.
2. End each of the seven cases with 60000, the timeout of a case that starts a daemon.

## Validation

- The file passes.
- Run `pnpm -s typecheck`, and see it exit 0.

## Resume

Built 2026-10-29.
Every step is built. The Validation's checks run on a quiet machine before this is offered upstream.

`run` waits 15000 ms, and each of the seven cases ends with 60000, the two plugin cases' 10000 among them.

Judgement calls the plan does not decide, each visible in the file it is made in:

- One timeout for every case, and not the suite's default for the cases that had none. Each of them runs a daemon, and a wait above the suite's 5 s needs a case timeout above it.
