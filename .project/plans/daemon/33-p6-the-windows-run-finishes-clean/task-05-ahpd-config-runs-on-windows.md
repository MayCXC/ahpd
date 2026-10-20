---
title: ahpd config runs on Windows
status: done
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: server
refs:
  - "[code://packages/server/test/config-layers.test.ts#L233](../../../../packages/server/test/config-layers.test.ts#L233) - an `ahpd config` case that exits 1"
---

## Objective

The three `ahpd config` and startup cases in `config-layers.test.ts` exit 0 on Windows.

## Files

- `UPDATE: packages/server/test/config-layers.test.ts` - the three cases, if the cause is in the test.
- `UPDATE: packages/server/src` - the cause, if it is in the source.

## Steps

1. Read the stderr of each case in task 03's log.
2. Find the cause.
3. Fix it in the source when a Windows user meets it, and in the test otherwise.
4. Run the gates.
5. Set this task and the plan row to `implemented`.

## Validation

- `config-layers.test.ts` passes on Windows.
- The gates pass on Linux.

## Resume

Done 2026-10-20 on a Windows 10 VM, from `main` at `8ad65e71`. Not reviewed.

The cause was in the test: its CLI ran under `NODE_OPTIONS=--import <drive path>`, and Node's loader takes an absolute Windows path there only as a `file:` URL, so the child exited 1 before it read any configuration.
Task 12's commit `adfe9146` already gave `--import` a URL through `pathToFileURL`, so no source change was needed and no Windows user meets it: only the test starts ahpd with that flag.
On the VM, `config-layers.test.ts` passes 19 of 19; with the bare path put back, exactly the three cases of this task fail.
The `check-windows` job of PR #43 passed the file, 19 of 19.
