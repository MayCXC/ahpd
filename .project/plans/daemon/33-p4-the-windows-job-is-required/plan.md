---
title: The Windows job is required
domain: daemon
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/daemon/33-ahpds-checks-pass-on-windows/plan.md
changes: []
creates: []
refs:
  - "[code://.github/workflows/ci.yml#L13-L51](../../../../.github/workflows/ci.yml#L13-L51) - the jobs CI runs"
  - "[code://DEVELOPER.md#L78-L90](../../../../DEVELOPER.md#L78-L90) - the checks, and where they run"
---

## Goal

The Windows job fails a run when a check fails, as the Linux jobs do.
`DEVELOPER.md` says the checks run on Windows, and how a test skips there.

## Reconnaissance

### Searches performed

- `git grep -n "continue-on-error" .github/workflows` - p1 adds the only one.
- `git grep -n "Windows" DEVELOPER.md` - the guide names Windows for the clone and for `ahpd restart`.

### What is true now

- After p1, the Windows job reports and does not fail a run.
- After p5, a terminal on Windows starts PowerShell.
- `DEVELOPER.md` says every check runs in CI, on no named system.

### Gaps

- None.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The job blocks once p2, p3 and p5 pass on Windows | Softov, 2026-10-16, chose "Report only until p2 and p3 land, then p4 makes it required" for "How does the Windows job start?" | 01 |
| p5 lands before the job blocks too | (defaulted: its terminal tests fail on Windows until it lands) | 01 |

## Proposed architecture

- **Data flow:** a push -> the Windows job -> a failed check fails the run.
- **Layer responsibilities:** CI: the job blocks. Docs: the guide names Windows and the skip helper.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The Windows job blocks a merge](task-01-the-windows-job-blocks-a-merge.md) | done | - |
| [02 - The guide says the checks run on Windows](task-02-the-guide-says-checks-run-on-windows.md) | done | 01 |

## Risks and tradeoffs

- A slow Windows runner makes a run take longer. The job keeps the same `timeout-minutes` as `check`.

## Resume state

- **Done so far:** drafted 2026-10-16, and planned 2026-10-16. Tasks 01 and 02 implemented 2026-10-19, after the Windows job passed on PR 30 and on `main`: the job blocks a run, and the guide says the checks run on Windows.
- **Next action:** none. Built 2026-10-20; see [implemented.md](implemented.md). The ruleset "main checks" requires `check-windows`.
- **Open questions:** none.
- **Watch out for:** a branch rule on GitHub names the required checks. Softov adds the new job there.

## Final verification checklist

- [x] A failed check on Windows fails the run.
- [x] `DEVELOPER.md` names Windows and `tools/posix.ts`.
- [x] `pnpm -s docs:build` passes.
