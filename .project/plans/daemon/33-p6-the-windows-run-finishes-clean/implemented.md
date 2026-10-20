---
title: The Windows run finishes clean - implemented
date: 2026-10-20
refs:
  - git://d607eb8f
  - git://85f165ca
  - https://github.com/softov/ahpd/pull/43 - its `check-windows` job passed 349 files and 5780 cases on 2026-10-20, with no exit 124 and no `EBUSY`
  - "[code://packages/computer/src/manifest.ts](../../../../packages/computer/src/manifest.ts) - `mountParts`, a mount's source with a drive"
  - "[code://vitest.config.ts](../../../../vitest.config.ts) - twenty seconds a case on Windows"
  - "[code://.github/workflows/ci.yml](../../../../.github/workflows/ci.yml) - the `check-windows` job's 600 s bound"
---

A daemon on Windows opens no console window for a process it starts, and reads a profile mount with a drive letter as a mount.
A client's Windows path is read, compared and given back by the host's own rules.
The Windows job runs every unit test to the end and passes, and a test's cleanup no longer fails on a folder Windows still holds.

## What was built

- Every process spawn in `packages/*/src` sets `windowsHide: true` - task 01.
- [`code://packages/computer/src/manifest.ts`](../../../../packages/computer/src/manifest.ts) - `mountParts` reads a drive letter as part of a mount's source, and the dev container's two mount spellings use it - task 02.
- [`code://.github/workflows/ci.yml`](../../../../.github/workflows/ci.yml) - the `check-windows` job's test bound is 600 s; `check` and `processes` keep 300 s - task 03.
- A test's removal of its folder retries with `maxRetries`, and an ACP server on Windows is stopped and what it leaves running is ended after it exits - task 04.
- `ahpd config` and the startup were already fixed by task 12's `--import` URL in the test; no source change - task 05.
- A tree's removal finds its links among the ignored entries too, so it no longer deletes the checkout's `node_modules` through a junction - task 06.
- A changeset's sides and a write through the host name Windows paths, compared without case - task 07.
- Every git of a test run has `core.autocrlf=false`, and no test reads the machine's git config or keys - task 08.
- The update and control tests run on Windows, the in-process update as a Linux install in POSIX paths - task 09.
- The daemon tests stop what they start, and a POSIX-only one skips with its reason - task 10.
- A host path is absolute by the host's rule; a path inside a machine stays POSIX - task 11.
- `set_workspace` and `create_session` read a client's path by the host's rules, and a `file:` URI naming another machine is refused on every system - task 12.
- A path is compared with a pattern, a key or a mount in the host's spelling - task 13.
- The last three Windows cases of PR 29 pass - task 14.
- A test case has twenty seconds on Windows, by [On Windows, a test has twenty seconds](../../../decisions/on-windows-a-test-has-twenty-seconds.md) - task 15.

## Verified

- On Softov's Windows machine, 2026-10-19: every file the Windows run of PR 25 failed passes on its own, and `nested-start.test.ts` passes.
- On a Windows 10 VM, 2026-10-20: `config-layers.test.ts` passes 19 of 19, and with the bare `--import` path put back exactly task 05's three cases fail.
- PR #43's `check-windows` job, 2026-10-20: 349 files and 5780 cases pass, 3 files and 66 cases skip, with no exit 124 and no `EBUSY`; the Linux jobs pass.
- Softov chose to close the plan on 2026-10-20.

## Departures from the plan

- Tasks 06 to 15 were added as the Windows runs of PRs 7 to 29 found them.
- Task 05 needed no change of its own: task 12 had fixed its cause.
- Task 01 set `windowsHide` on three spawns its Files list did not name.

## Left for later

- The process tests on Windows: [p8](../33-p8-the-process-tests-pass-on-windows/plan.md).
