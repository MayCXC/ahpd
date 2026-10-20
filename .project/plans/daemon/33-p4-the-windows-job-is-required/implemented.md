---
title: The Windows job is required - implemented
date: 2026-10-20
refs:
  - git://de836897 - the job blocks, and the guide names Windows
  - git://b6972c4d - the merge of PR #37
  - "[code://.github/workflows/ci.yml#L59-L60](../../../../.github/workflows/ci.yml#L59-L60) - `check-windows`, with no `continue-on-error`"
  - "[code://DEVELOPER.md#L81-L83](../../../../DEVELOPER.md#L81-L83) - the checks run on Linux and on Windows"
---

A failed check in `check-windows` fails the CI run, and a pull request to `main` cannot merge until `check` and `check-windows` pass.

## What was built

- [`code://.github/workflows/ci.yml`](../../../../.github/workflows/ci.yml) - `continue-on-error` is gone from `check-windows`.
- [`code://DEVELOPER.md`](../../../../DEVELOPER.md) - the checks run on Linux and on Windows, and a POSIX-only test skips with `tools/posix.ts`.
- On GitHub, the ruleset "main checks" (id 25450788) on `main` requires `check` and `check-windows`. The repository admin role can bypass it, so a plan-only push to `main` still works.

## Verified

- 2026-10-20: `gh api repos/softov/ahpd/rules/branches/main` lists `check` and `check-windows` as required.
- `check-windows` passed on main at `dbbca58f` and at `e7b172de`.
- `pnpm -s docs:build` passed when task 02 was built.

## Departures from the plan

- The fix for `gemini.CMD` in `onPath` went into task 01, because main was red on Windows after daemon/28 merged.
