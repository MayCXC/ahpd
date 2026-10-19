---
title: A mount with a drive is a mount
status: implemented
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

## Resume

Implemented 2026-10-18. The two new cases pass on Linux, as do the computer mount suites and `nested-start.test.ts`: 169 cases across seven files. `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

Files changed:
- `packages/computer/src/manifest.ts` - `MOUNT` takes an optional drive letter before the source. `mountParts` reads the source and the target at the first `:` after that drive, and drops a `:ro` suffix. `targetOf` and `sourceOf` use it, so `C:\work:/work` is the source `C:\work` and the target `/work`. `sourceOf` accepts the drive form as absolute on `win32` only.
- `packages/computer/src/runtime.ts` - `cliMount` and the read-only override use `mountParts`, in place of `split(':')` and `lastIndexOf(':')`. Both are places in `packages/computer/src` that split a mount on `:`, which step 1 asks for. The second read the last colon and already worked for a drive; it reads the same way now.
- `packages/computer/test/mounts.test.ts` - the two cases, `C:\work:/work` and `C:\work:/work:ro`.

Past the Files section: the task names no test file and no way to make a drive path exist on Linux. `mountParts` is exported so the two cases ask the parse itself, without a Windows filesystem. The end-to-end check (`MOUNT` and `sourceOf`) and `nested-start.test.ts` need Windows, which this host is not; that half is task 03's run or Softov's machine.
