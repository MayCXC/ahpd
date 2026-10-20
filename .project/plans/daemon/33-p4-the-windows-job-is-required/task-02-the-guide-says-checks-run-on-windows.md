---
title: The guide says the checks run on Windows
status: done
depends: [task-01-the-windows-job-blocks-a-merge.md]
layer: docs
refs:
  - "[code://DEVELOPER.md#L78-L90](../../../../DEVELOPER.md#L78-L90) - the checks"
---

## Objective

`DEVELOPER.md` says the checks run on Linux and on Windows.
It says that a POSIX-only test skips with `tools/posix.ts` and names its reason.

## Files

- `UPDATE: DEVELOPER.md:78-90` - one sentence on the two systems, and one on the skip helper.

## Steps

1. Add a sentence after the CI sentence: the checks run on Linux and on Windows.
2. Add a sentence on `tools/posix.ts` and the reason beside each skip.
3. Run `pnpm -s docs:build`.
4. Set this task and the plan row to `implemented`.

## Validation

- `DEVELOPER.md` names Windows and `tools/posix.ts`.
- `pnpm -s docs:build` passes.

## Resume

Done 2026-10-19. Not reviewed.

`DEVELOPER.md` says the checks run on Linux and on Windows and that a failure on either fails the run, which tests Windows leaves to Linux, and how a POSIX-only test skips with `tools/posix.ts` and its reason.
`pnpm -s docs:build` passes, after `pnpm -s build`: the docs read the server's built command registry.
