---
title: The process tests pass on Windows - implemented
date: 2026-10-20
refs:
  - git://89eccdfe
  - https://github.com/softov/ahpd/pull/49 - every job green, merged on 2026-10-20
  - "[code://packages/sdk/src/terminals.ts#L134-L153](../../../../packages/sdk/src/terminals.ts#L134-L153) - `crtEscaped` and `isWindowsPowerShell`"
  - "[code://packages/sdk/test/wire.test.ts#L607-L641](../../../../packages/sdk/test/wire.test.ts#L607-L641) - `steady` and the capture written from a POSIX run only"
---

The process tests pass on a Windows host with Windows PowerShell 5.1 and no PowerShell 7, and the cases that are POSIX by nature say why they skip.
A terminal started with an argv under Windows PowerShell 5.1 hands the program each word whole.
The wire capture is the same on every run and names no real person or machine.

## What was built

- [`code://packages/sdk/src/terminals.ts`](../../../../packages/sdk/src/terminals.ts) - under `powershell.exe`, the words of an argv after the program are escaped for the C runtime, by [Windows PowerShell 5.1 is given an argv escaped for the C runtime](../../../decisions/windows-powershell-5-is-given-an-argv-escaped-for-the-c-runtime.md) - task 04.
- `agent-pi-lazy`, `conformance` and `host-terminals` wait up to `WAIT_MS` - task 01.
- `computer-spawn` and `nested-process` stand in with this Node running a script, where they ran `cat`, `sleep`, `true`, `false` and `sh -c` - task 02.
- 25 cases in six files skip on Windows with their reason beside them, and the stop sent while a restart is stopping expects the `control pipe` receipt there - task 03.
- The two `pty` cases whose stand-ins catch the kill end their own shell, so the run's folder can be removed on Windows - task 05.
- `wire.test.ts` pins the home for its capture, maps the session ids inside chat URIs, and writes the capture from a POSIX run only; `wire.jsonl` is regenerated on Linux - task 06.

## Verified

- On a Windows 10 VM with Windows PowerShell 5.1 and Docker Desktop 29.9.1, 2026-10-20: each of the 43 process-test files run alone; the 11 that failed pass with their skips, and `pty.test.ts` exits 0 with no teardown error.
- In a disposable `node:22` container on that VM: two Linux runs of `wire.test.ts` pass 17 of 17 and write the same capture.
- On a Windows host with PowerShell 7: typecheck, boundary and the 12 changed test files pass after merging `main`.
- PR #49: every job passed, and Softov merged it on 2026-10-20.

## Departures from the plan

- Tasks 05 and 06 were added while the plan ran: the `pty` teardown error and the wire capture were found by its runs.
- The child that closes its stdin moved from task 02 to task 03's skips: on Windows a write to its closed pipe is queued, with no `EPIPE` to see.

## Left for later

- `install-ps1.test.ts` at the Windows limit on a desktop, and the suites that move only `HOME` - see [deferred.md](deferred.md).
- The old capture with a real user name is in the history of `main`; taking it out of the history is Softov's call.
