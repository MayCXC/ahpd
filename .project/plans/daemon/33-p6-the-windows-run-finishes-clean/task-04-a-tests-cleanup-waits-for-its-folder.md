---
title: A test's cleanup waits for its folder
status: todo
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: tests
refs:
  - "[code://tools/test-tmpdir.ts#L21](../../../../tools/test-tmpdir.ts#L21) - the run's removal"
---

## Objective

A test's removal of its temporary folder does not fail on `EBUSY` while a process lets go of it.

## Files

- `UPDATE: packages/sdk/test` - each removal in task 03's list that fails on `EBUSY`.
- `UPDATE: tools/test-tmpdir.ts:21` - the run's removal retries too.

## Steps

1. Take the `EBUSY` failures from task 03's list.
2. Find the `rmSync` or `rm` call in each one.
3. Add `maxRetries: 5` and `retryDelay: 100` to it.
4. Find the process that holds the folder, if a retry does not clear it.
5. Stop that process before the removal.
6. Run the gates.
7. Set this task and the plan row to `implemented`.

## Validation

- The Windows job's log has no `EBUSY`.
- The gates pass on Linux.
