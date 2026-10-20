---
title: The Windows job blocks a merge
status: done
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

Done 2026-10-19. Not reviewed.

The Windows job passed on PR 30 and again on `main` at `11594e43`, with no failed test.
`continue-on-error` is gone from `check-windows`, and the comment above the job says a failure there fails the run.
`.project/pending/windows-branch-rule.md` asks Softov to add `check-windows` to the rule for `main`.
The first half of Validation is the next run with a failing Windows test.

`main` at `a1d6aaf8` was red on Windows again: daemon/28 merged while the job did not block, and its setup named a found agent `gemini.CMD` where the file is `gemini.cmd`.
`onPath` now names a file found on Windows as its folder holds it, with a Windows case in `onpath.test.ts`.
The gone-folder cases remove their folder with an awaited, retried delete, as p6 task 04 did elsewhere.
On Softov's Windows machine the full unit suite passes apart from load timeouts, each of whose files passes alone.
