---
title: A Windows job runs the checks
domain: daemon
status: active
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/daemon/33-ahpds-checks-pass-on-windows/plan.md
changes: []
creates: []
refs:
  - "[code://scripts/boundary.mjs#L23](../../../../scripts/boundary.mjs#L23) - `ROOT` from `new URL('..', import.meta.url).pathname`"
  - "[code://scripts/boundary.mjs#L59-L61](../../../../scripts/boundary.mjs#L59-L61) - `ROOT` joined to `packages`"
  - "[code://package.json#L27](../../../../package.json#L27) - `test:unit` and its single-quoted `--exclude` globs"
  - "[code://tools/test-tmpdir.ts#L15-L16](../../../../tools/test-tmpdir.ts#L15-L16) - the run's folder in `TMPDIR`"
  - "[code://.github/workflows/ci.yml#L13-L51](../../../../.github/workflows/ci.yml#L13-L51) - the `check` job"
  - "[code://.github/workflows/ci.yml#L45-L46](../../../../.github/workflows/ci.yml#L45-L46) - `timeout 300 pnpm test:unit`"
---

## Goal

The checks start on Windows, and a `windows-latest` job in CI runs them.
The job's log names each test that fails, so p2 and p3 fix a known list.

## Reconnaissance

### Searches performed

- `git grep -n "pathname" scripts tools` - only `boundary.mjs` reads a URL pathname as a path.
- `git grep -n "'" package.json` - `test:unit` is the one script that quotes with single quotes.

### What is true now

- On Windows, `new URL('..', import.meta.url).pathname` is `/F:/...`, and `join` turns it into no real folder. `fileURLToPath` gives the drive path.
- pnpm runs a script with `cmd.exe` on Windows. `cmd.exe` keeps single quotes, so vitest gets globs with quotes in them, and the excludes match nothing. Double quotes work in both shells.
- `os.tmpdir()` reads `TEMP` or `TMP` on Windows, not `TMPDIR`. The run's folder is not used, and the tests leave their folders in the system's.
- A Windows runner's default shell is PowerShell, where `timeout` is not the POSIX command.

### Gaps

- Whether Git Bash on `windows-latest` has `timeout`. Task 03 step 1 reads it in the first run.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `fileURLToPath` gives the root | (defaulted: `vitest.config.ts` and `tools/test-tmpdir.ts` do the same) | 01 |
| The globs take double quotes | (defaulted: both shells strip them) | 02 |
| The test folder goes in `TEMP` and `TMP` too | (defaulted: `os.tmpdir()` reads them on Windows) | 02 |
| The Windows steps run under `shell: bash` | (defaulted: one script for both systems) | 03 |
| The job reports and does not block a merge until p4 | Softov, 2026-10-16, chose "Report only until p2 and p3 land, then p4 makes it required" for "How does the Windows job start?" | 03 |
| Only the `check` job runs on Windows | Softov, 2026-10-16, chose "`check` only" for "Which jobs run on Windows?" | 03 |

## Proposed architecture

- **Data flow:** a push -> `check` on Linux and `check-windows` on Windows -> boundary, typecheck, the unit tests and the build.
- **Layer responsibilities:** scripts: a path from the system. CI: a second job with the same steps.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The boundary finds its root on Windows](task-01-the-boundary-finds-its-root-on-windows.md) | implemented | - |
| [02 - The test scripts run in both shells](task-02-the-test-scripts-run-in-both-shells.md) | implemented | - |
| [03 - A Windows job runs the checks](task-03-a-windows-job-runs-the-checks.md) | implemented | 01, 02 |

## Risks and tradeoffs

- The job reports and does not block a merge until p4. A red Windows run is still read as red.

## Resume state

- **Done so far:** drafted 2026-10-16, and planned 2026-10-16. Tasks 01, 02 and 03 implemented 2026-10-16 and not reviewed. Task 03's job is written and the workflow parses. Its first run is not read, because steps 6 to 9 need a push.
- **Next action:** push the branch, or open a pull request against `main`, so the `check-windows` job runs. Then read that run. Record in task 03's Resume whether `timeout` ran under Git Bash. Record the failing tests by file in the parent plan's Resume.
- **Open questions:** whether Git Bash on `windows-latest` has `timeout`. Task 03 step 7 answers it from the run.
- **Watch out for:** a checkout on Windows needs `core.longpaths`, as `DEVELOPER.md` says. Task 03's job sets it before the checkout, and a hand clone does not.

## Final verification checklist

- [ ] `pnpm boundary` passes on Linux, and on Windows in the job.
- [ ] `pnpm test:unit` leaves out the same files on Linux as before.
- [ ] The Windows job runs, and its log names each failing test.
- [ ] The failure list is in the parent plan's Resume.
