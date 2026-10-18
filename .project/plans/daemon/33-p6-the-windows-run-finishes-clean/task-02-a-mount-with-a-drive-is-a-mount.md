---
title: A mount with a drive is a mount
status: todo
depends: []
layer: computer
refs:
  - "[code://packages/computer/src/manifest.ts#L562](../../../../packages/computer/src/manifest.ts#L562) - `MOUNT`"
  - "[code://packages/computer/src/manifest.ts#L571](../../../../packages/computer/src/manifest.ts#L571) - `targetOf`"
  - "[code://packages/sdk/test/nested-start.test.ts#L106](../../../../packages/sdk/test/nested-start.test.ts#L106) - the profile mount `${work}:/work`"
---

## Objective

A mount whose source starts with a drive letter, such as `C:\work:/work`, passes the check and gives its target.

## Files

- `UPDATE: packages/computer/src/manifest.ts:562-575` - `MOUNT`, `targetOf` and the source read the drive letter.
- `UPDATE: packages/computer/test` - a case for `C:\work:/work` and one for `C:\work:/work:ro`.

## Steps

1. Find each place in `packages/computer/src` that splits a mount on `:`.
2. Read an optional drive letter, `X:`, at the start of the source.
3. Take the first `:` after it as the separator.
4. Add the two cases in Files, and run them on Linux.
5. Run the gates.
6. Set this task and the plan row to `implemented`.

## Validation

- The new cases pass on Linux.
- `nested-start.test.ts` passes on Windows.
