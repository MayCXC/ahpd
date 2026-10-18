---
title: The Windows job runs to the end
status: implemented
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

## Resume

Step 1 only, implemented 2026-10-18. `.github/workflows/ci.yml:93` reads `timeout 600 pnpm test:unit` in the `check-windows` job, with a comment saying why the bound is longer than `check`'s. The `check` and `processes` jobs keep `timeout 300`.

Step 2 is not done here: pushing the branch through a PR and reading the Windows job's log is Softov's. So step 3 recorded nothing, and the Validation above is not checked. Tasks 04 and 05 wait for that log.
