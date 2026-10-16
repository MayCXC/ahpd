---
title: A Windows job runs the checks
status: todo
depends: [task-01-the-boundary-finds-its-root-on-windows.md, task-02-the-test-scripts-run-in-both-shells.md]
layer: CI
refs:
  - "[code://.github/workflows/ci.yml#L13-L51](../../../../.github/workflows/ci.yml#L13-L51) - the `check` job"
---

## Objective

A `check-windows` job on `windows-latest` runs boundary, typecheck, the unit tests and the build.
It reports and does not block a merge.

## Files

- `UPDATE: .github/workflows/ci.yml:13-51` - a `check-windows` job beside `check`.

## Steps

1. Copy the `check` job as `check-windows`, on `windows-latest`.
2. Set `core.longpaths` before the checkout.
3. Run each step under `shell: bash`.
4. Set `continue-on-error: true` on the job.
5. Leave out the pack step.
6. Ask Softov to push the branch, then read the first run's log.
7. Record whether `timeout` ran in Resume.
8. Record the failing tests by file in the parent plan's Resume.
9. Set this task and the plan row to `implemented`.

## Validation

- The job runs on a push, and the Linux jobs run as before.
- Its log names each failing test.

## Resume
