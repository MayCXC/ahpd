---
title: ahpd config runs on Windows
status: todo
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
