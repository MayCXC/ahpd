---
title: The sdk's tests build their paths
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/test/fileuri.test.ts#L42](../../../../packages/sdk/test/fileuri.test.ts#L42) - a split on `/`"
  - "[code://packages/sdk/test/attachments.test.ts#L44](../../../../packages/sdk/test/attachments.test.ts#L44) - a label from a split on `/`"
---

## Objective

The sdk tests in p1's failure list that fail on a path build their paths and URIs the system's way.

## Files

- `UPDATE: packages/sdk/test` - each file in p1's failure list whose cause is a path.

## Steps

1. Sort p1's sdk failures by cause, and keep the ones that fail on a path.
2. Find the literal in each one that the code converts.
3. Build that value with `join`, `uriOf`, `localPath` or `basename`.
4. Split a path with `sep`, or with `basename`, in place of `/`.
5. Keep a literal that the code passes through unchanged.
6. Run the sdk tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass on Linux.
- The Windows job passes every sdk test that failed on a path.

## Resume
