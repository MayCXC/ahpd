---
title: Terminals run on Windows - implemented
date: 2026-10-19
refs:
  - git://3328b293
  - git://cae59797
  - https://github.com/softov/ahpd/actions/runs/39344018005/job/118372148963 - the `check-windows` job of PR #30, green on 2026-10-19
  - "[code://packages/sdk/src/terminals.ts](../../../../packages/sdk/src/terminals.ts) - `shellOf`, the arguments and quoting for each shell, and `endTree`"
  - "[code://packages/sdk/test/pty.test.ts](../../../../packages/sdk/test/pty.test.ts) - the cases for each shell and each system"
---

A terminal on a Windows host starts a Windows shell, runs a command, stops on `^C` and closes with what it started.
The terminal tests run on Windows, with no skip.

## What was built

- [`code://packages/sdk/src/terminals.ts`](../../../../packages/sdk/src/terminals.ts) - on Windows, `shellOf` answers the asked shell, then PowerShell 7, then Windows PowerShell, then `ComSpec`, then `cmd.exe`. It does not read `SHELL` there.
- The same file gives PowerShell `-NoProfile -Command`, `cmd.exe` `/d /s /c` and a POSIX shell `-c`, each with its own quoting. A `cmd.exe` line goes over verbatim, in the outer quotes that `/s` strips.
- PowerShell exits with `$LASTEXITCODE` after a command, so a `!` command keeps its exit code.
- The pipe spawn sets `windowsHide`, and is not detached on Windows. `^C` and `close` run `taskkill /pid <pid> /T /F`. A shell with no pid is not signalled.
- The terminal tests start their shells in `tmpdir()`, close their terminals before the cleanup, and wait for their own turn.

## Verified

- `pty.test.ts`: `takes PowerShell 7 from where its installer put it`, `falls back to ComSpec, and then to cmd.exe` and `does not read SHELL there, which is a leftover rather than a Windows shell` pass.
- `pty.test.ts`: `gives PowerShell -NoProfile -Command, and doubles a quote inside a word`, `gives cmd.exe /d /s /c, one line in the outer quotes its /s strips` and `gives a POSIX shell -c, as it always has` pass.
- `pty.test.ts`: `ends the shell's tree with taskkill on Windows, since there is no group to signal`, `runs no taskkill for a shell that never started` and `sends SIGKILL to the group off Windows, as it always has` pass.
- On Windows 10, 2026-10-18: `taskkill /T` without `/F` stopped nothing under pipes, and `/T /F` ended the whole tree.
- On Softov's Windows machine, 2026-10-19: `host-terminals.test.ts` passed 24 of 24, and `pty.test.ts`, `shellenv.test.ts` and `conformance.test.ts` passed, with no skip.
- On 2026-10-19, the `check-windows` job of PR #30 passed, in run 39344018005.
- Softov approved the close on 2026-10-19.

## Departures from the plan

- `shellOf` takes the platform as well as the environment and the file check, so a Linux run tests the Windows branch.
- `^C` and `close` are the same call on Windows, because `taskkill` without `/F` stops nothing under pipes.
- The PowerShell exit line is a product fix that the plan did not name.
- p1's failure list did not exist when task 04 ran, so its files came from the tree.

## Left for later

- none.
