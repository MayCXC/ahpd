---
title: One helper names a POSIX-only case
status: todo
depends: []
layer: tools
refs:
  - "[code://packages/server/test/server-http.test.ts#L393](../../../../packages/server/test/server-http.test.ts#L393) - `it.skipIf`"
  - "[code://tools/test-tmpdir.ts](../../../../tools/test-tmpdir.ts) - a test helper in `tools/`"
---

## Objective

`tools/posix.ts` exports `posix`, which is true off Windows.
A test skips a case with `it.skipIf(!posix)`, and a comment beside it says why.

## Files

- `CREATE: tools/posix.ts` - `posix`, and a comment that says each use names its reason.

## Steps

1. Write `tools/posix.ts` with `export const posix = process.platform !== 'win32'`.
2. Say in its comment that each skip names its reason beside it.
3. Run `pnpm -s typecheck`.
4. Set this task and the plan row to `implemented`.

## Validation

- `pnpm -s typecheck` passes.
- The helper holds no test of its own.

## Resume
