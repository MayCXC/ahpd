---
title: The Windows job runs to the end
status: todo
depends: []
layer: CI
refs:
  - "[code://.github/workflows/ci.yml#L91](../../../../.github/workflows/ci.yml#L91) - `timeout 300 pnpm test:unit`"
---

## Objective

The Windows job runs every unit test, so its log lists every failure.

## Files

- `UPDATE: .github/workflows/ci.yml:91` - the bound goes to 600 s.

## Steps

1. Change `timeout 300` to `timeout 600` in the `check-windows` job only.
2. Push the branch through a PR, and read the Windows job's log.
3. Record the duration and the failing tests by file in the parent plan's Resume.
4. Set this task and the plan row to `implemented`.

## Validation

- The Windows job ends without exit 124.
