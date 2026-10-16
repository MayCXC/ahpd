---
title: The Windows job blocks a merge
status: todo
depends: []
layer: CI
refs:
  - "[code://.github/workflows/ci.yml#L13-L51](../../../../.github/workflows/ci.yml#L13-L51) - the jobs"
---

## Objective

The `check-windows` job fails a run when a check fails.

## Files

- `UPDATE: .github/workflows/ci.yml` - remove `continue-on-error` from `check-windows`.

## Steps

1. Read the last Windows run, and stop when a test fails.
2. Remove `continue-on-error` from `check-windows`.
3. Write in `.project/pending/` that Softov adds `check-windows` to the branch rule.
4. Set this task and the plan row to `implemented`.

## Validation

- A failed check in `check-windows` fails the run.
- The pending file names the branch rule.

## Resume
