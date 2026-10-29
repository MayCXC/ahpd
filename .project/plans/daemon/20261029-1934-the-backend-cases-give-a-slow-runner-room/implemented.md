---
title: The backend cases give a slow runner room - implemented
date: 2026-10-29
refs:
  - git://a0a91494 - the change
  - "[code://packages/server/test/daemon-backend.test.ts#L22-L33](../../../../packages/server/test/daemon-backend.test.ts#L22-L33) - `ENDS_WITHIN_MS` and `CASE_MS`"
---

`daemon-backend.test.ts` waits 40 s for a daemon to end on its own before it stops it, and each of its cases may take 60 s.
A daemon that starts slowly on a loaded machine runs to its own end. One that never ends still fails its case on an assertion.

## What was built

- [`code://packages/server/test/daemon-backend.test.ts`](../../../../packages/server/test/daemon-backend.test.ts) - `ENDS_WITHIN_MS`, the wait in `run`, and `CASE_MS`, the timeout of every case, with a comment on both.

## Verified

- The slow runner, made on purpose: the file's vitest run pinned to one CPU with `taskset`. Busy loops pinned to the same CPU share it.
- Before the change, with three busy loops on a machine other work kept busy, 5 of the 7 cases fail. Each daemon was killed at 4 s, so it left no exit code, or never said `ahpd over stdio`.
- After it, run next under the same three loops, the 7 pass, each in 4.3 to 11.1 s. With five loops they pass in up to 10.0 s.
- A 15 s wait, tried first under three loops, still cut two starts short. That is why the wait is 40 s.
- On one CPU with no busy loop, the file passes before the change, each case in 0.7 to 2.6 s.
- `pnpm -s typecheck` exits 0.
- Vitest on `packages/server` at one worker, on a machine other work kept busy: the run took 880 s, where a quiet run takes 326 s. The file's 7 cases pass, in 1.0 to 6.1 s.
- In the same run, 8 cases in other files fail. Seven reach the suite's 5 s timeout, and one reaches the 15 s wait of `cli.ts`.

## Departures from the plan

- none.

## Left for later

- none.
