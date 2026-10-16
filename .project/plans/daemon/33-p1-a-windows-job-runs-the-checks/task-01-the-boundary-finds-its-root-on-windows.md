---
title: The boundary finds its root on Windows
status: todo
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
