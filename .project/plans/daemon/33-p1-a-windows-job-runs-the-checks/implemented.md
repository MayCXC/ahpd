---
title: A Windows job runs the checks - implemented
date: 2026-10-19
refs:
  - git://997dda8c
  - git://11594e43 - the merge of PR #30, whose Windows run passed
  - https://github.com/softov/ahpd/actions/runs/39344018005/job/118372148963 - the `check-windows` job of PR #30, green on 2026-10-19
  - "[code://.github/workflows/ci.yml](../../../../.github/workflows/ci.yml) - the `check-windows` job"
  - "[code://scripts/boundary.mjs#L24](../../../../scripts/boundary.mjs#L24) - `ROOT` from `fileURLToPath`"
---

The checks start on Windows, and a `check-windows` job on `windows-latest` runs them on each push and pull request.
The job runs the boundary, the typecheck, the unit tests and the build under Git Bash.
It reports and does not block a merge until p4.

## What was built

- [`code://scripts/boundary.mjs`](../../../../scripts/boundary.mjs) - `ROOT` is a filesystem path from `fileURLToPath`, so the script reads the packages on Windows.
- [`code://package.json`](../../../../package.json) - `test:unit` quotes its `--exclude` globs with double quotes, which `sh` and `cmd.exe` both strip.
- [`code://tools/test-tmpdir.ts`](../../../../tools/test-tmpdir.ts) - the run's folder is set in `TEMP` and `TMP` beside `TMPDIR`.
- [`code://.github/workflows/ci.yml`](../../../../.github/workflows/ci.yml) - `check-windows`: `core.longpaths` before the checkout, each `run` step under `shell: bash`, `continue-on-error: true`, and no pack step.

## Verified

- On Linux, 2026-10-16: `pnpm boundary` printed the same eleven packages, and `pnpm test:unit` collected 292 files and 5142 tests before and after the change.
- On 2026-10-19, the `check-windows` job of PR #30 passed every step: install, boundary, typecheck, tests and build. That is run 39344018005 at `85f165ca`, merged as `11594e43`.
- Git Bash on `windows-latest` has `timeout`: the tests step runs under it.
- Softov approved the close on 2026-10-19.

## Departures from the plan

- The tests step runs under `timeout 600`, not 300. p6 raised it in `d607eb8f`, because the Windows run did not finish in 300 s.
- The failure list went into p6, from the runs of PR 7, and not into the parent plan's Resume.

## Left for later

- p4 removes `continue-on-error` and makes the job required.
