---
title: The boundary finds its root on Windows
status: done
depends: []
layer: scripts
refs:
  - "[code://scripts/boundary.mjs#L23](../../../../scripts/boundary.mjs#L23) - `ROOT`"
---

## Objective

`scripts/boundary.mjs` takes its root from `fileURLToPath`, so it reads the packages on Windows.

## Files

- `UPDATE: scripts/boundary.mjs:23` - `fileURLToPath(new URL('..', import.meta.url))`.

## Steps

1. Import `fileURLToPath` from `node:url`.
2. Set `ROOT` from `fileURLToPath`.
3. Read the script for another pathname, and change it the same way.
4. Run `pnpm boundary`.
5. Set this task and the plan row to `implemented`.

## Validation

- `pnpm boundary` passes on Linux with the same output.
- The Windows job of task 03 passes its boundary step.

## Resume

Done 2026-10-16. Every step is built.

`ROOT` is a filesystem path now, so the script reads the packages on Windows.

File by file:

- `scripts/boundary.mjs` - `fileURLToPath` is added to a new `node:url` import (step 1), and line 23 is `fileURLToPath(new URL('..', import.meta.url))` (step 2). The same shape as `tools/test-tmpdir.ts:29` and `vitest.config.ts`.
- Step 3: line 23 was the only pathname in the script. Nothing else reads a URL as a path, so nothing else changed.

Judgement calls the plan does not decide:

- `ROOT` keeps the trailing separator of `new URL('..', ...)`, as the previous `.pathname` did. Both uses take it: `join` normalizes it away, and `file.slice(ROOT.length)` lands on the first segment either way, so the reported file paths are unchanged.

Validation:

- `pnpm boundary` exits 0 and prints the same eleven packages, each `none undeclared`.
- `pnpm -s build`, `pnpm -s typecheck` and `node tools/schema.mjs` each exit 0, and `git diff --quiet tools/` is clean.
- The second item of the Validation is the boundary step of task 03's Windows job. It needs a push, which task 03 step 6 asks Softov for.

Left:

- Nothing is committed, as asked.

Closed 2026-10-19: the boundary step of the `check-windows` job passed on PR #30, in run 39344018005.
