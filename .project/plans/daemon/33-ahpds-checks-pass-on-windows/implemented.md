---
title: ahpd's checks pass on Windows - implemented
date: 2026-10-20
refs:
  - git://470f736f - the merge of PR #49, the last child's work
  - https://github.com/softov/ahpd/actions/runs/39505815678 - the CI run of that merge on `main`
  - "[code://.github/workflows/ci.yml](../../../../.github/workflows/ci.yml) - the `check-windows` job, required by the ruleset"
  - "[code://tools/posix.ts](../../../../tools/posix.ts) - `posix`, the skip a POSIX-only case uses"
  - "[code://DEVELOPER.md#L78-L84](../../../../DEVELOPER.md#L78-L84) - where the checks run"
---

ahpd's checks pass on Windows, and a required `check-windows` job keeps them so: `pnpm boundary`, `pnpm typecheck`, `pnpm test:unit` and `pnpm build`.
A terminal runs on Windows, a Windows folder has a path in a machine, and the process tests pass on a Windows machine by hand.
A test that cannot run on Windows says why it skips.

## What was built

- [p1](../33-p1-a-windows-job-runs-the-checks/implemented.md) - a `check-windows` job runs the checks on `windows-latest`.
- [p2](../33-p2-tests-build-paths-the-systems-way/implemented.md) - tests build paths the system's way.
- [p3](../33-p3-posix-only-tests-say-why-they-skip/implemented.md) - a POSIX-only test skips with `it.skipIf(!posix)` and its reason.
- [p4](../33-p4-the-windows-job-is-required/implemented.md) - the Windows job is required, and the guide says the checks run on Windows.
- [p5](../33-p5-terminals-run-on-windows/implemented.md) - a terminal starts a Windows shell, runs a command and stops.
- [p6](../33-p6-the-windows-run-finishes-clean/implemented.md) - the Windows run finishes clean: hidden spawns, drive mounts, the host's path rules, twenty seconds a case.
- [p7](../33-p7-a-windows-folder-has-a-path-in-the-machine/implemented.md) - a Windows folder is mounted in a machine at its drive-style path, and checked with Docker Desktop.
- [p8](../33-p8-the-process-tests-pass-on-windows/implemented.md) - the process tests pass on a Windows host with Windows PowerShell 5.1, and an argv runs whole there.

## Verified

- The `check-windows` job of `main` after PR #49 passed, with the Linux jobs.
- Every skip on Windows names its reason in a comment beside it, by p3's rule; the terminal tests run there with no skip, by p5.
- The Linux jobs skip no test that ran before: each Windows skip is `!posix`.

## Departures from the plan

- p6, p7 and p8 were added as Windows runs found what p2, p3 and p5 did not cover, each by Softov's answer.
- The process tests are checked on a Windows machine by hand, not in CI: only `check` runs on Windows, by the plan's answer.

## Left for later

- [p7's deferred.md](../33-p7-a-windows-folder-has-a-path-in-the-machine/deferred.md) and [p8's deferred.md](../33-p8-the-process-tests-pass-on-windows/deferred.md).
