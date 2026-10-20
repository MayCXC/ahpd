---
title: The daemon tests stop what they start
status: done
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: tests
refs:
  - "[code://packages/server/test/daemon.test.ts](../../../../packages/server/test/daemon.test.ts) - `announcer`, the Windows control case, and the POSIX-only cases"
---

## Objective

On Windows, `daemon.test.ts` passes and leaves no process running.

## Files

- `UPDATE: packages/server/test/daemon.test.ts` - the fixture daemon listens on the control pipe `start` hands it and exits on a request; a Windows case checks the control is recorded, handed over and used; the cases about a SIGTERM, a POSIX mode, another user's pid and an unreadable file skip on Windows.

## Steps

1. Reproduce: 11 cases fail, and every run leaves four fixture daemons running.
2. Find the cause of the leftovers: on Windows a stop goes over the control pipe, and the fixture never listened on one, so `stop()` could not end it.
3. Make the fixture listen on `AHPD_CONTROL`'s pipe and exit on a request.
4. Add the Windows half of "records no control", which the file had left to a hand check.
5. Mark the cases that are POSIX by nature with `it.skipIf(!posix)` and the reason beside each.
6. Run the file and count the test processes left.
7. Set this task and the plan row to `implemented`.

## Validation

- `daemon.test.ts` passes on Windows, and no `announce` process is left after it.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine: 57 cases pass and 7 skip, and no test process is left.
The folder-rewrite case keeps its record check on Windows; only its mode check is POSIX.
The Linux half of Validation is the CI run of the branch.
