---
title: Terminals run on Windows
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
  - "[code://packages/sdk/src/terminals.ts#L19](../../../../packages/sdk/src/terminals.ts#L19) - `shellOf`: `SHELL` or `/bin/sh`"
  - "[code://packages/sdk/src/terminals.ts#L27](../../../../packages/sdk/src/terminals.ts#L27) - `quoted`, for a POSIX shell"
  - "[code://packages/sdk/src/terminals.ts#L47](../../../../packages/sdk/src/terminals.ts#L47) - the title, cut at the last `/`"
  - "[code://packages/sdk/src/terminals.ts#L92-L96](../../../../packages/sdk/src/terminals.ts#L92-L96) - `-c` with a line or a quoted argv"
  - "[code://packages/sdk/src/terminals.ts#L184-L200](../../../../packages/sdk/src/terminals.ts#L184-L200) - the shell under pipes, `detached` for its own process group"
  - "[code://packages/sdk/src/terminals.ts#L318-L337](../../../../packages/sdk/src/terminals.ts#L318-L337) - `^C` as `SIGINT` to the process group"
  - "[code://packages/sdk/src/terminals.ts#L369-L385](../../../../packages/sdk/src/terminals.ts#L369-L385) - `close` sends `SIGKILL` to the process group"
  - "[code://packages/sdk/src/host/terminals.ts#L291](../../../../packages/sdk/src/host/terminals.ts#L291) - a connection's `defaultShell` names the shell"
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/base/node/shell.ts#L16-L26 - `getSystemShell`: on Windows, PowerShell, and `SHELL` is not read
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/base/node/shell.ts#L64-L70 - `getSystemShellWindows`: the first PowerShell found
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/base/node/powershell.ts#L250-L304 - the order: PowerShell 7 first, Windows PowerShell last
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L931-L942 - VS Code's agent host: `defaultShell`, then the system shell
---

## Goal

A terminal on a Windows host starts a Windows shell, runs a command, stops on `^C` and closes with what it started.
The terminal tests run on Windows instead of skipping.

## Reconnaissance

### Searches performed

- `git grep -n "SHELL\|/bin/sh\|process.kill(-" packages/sdk/src/terminals.ts` - the POSIX parts of a terminal.
- `rg -n "getSystemShell" /github/externals/vscode/src/vs/platform/agentHost` - VS Code's agent host asks `getSystemShell`.
- `git show a959ba62444:src/vs/base/node/shell.ts` in VS Code - the Windows branch.

### What is true now

- A terminal runs `SHELL` or `/bin/sh`. Windows has neither, so the spawn fails.
- A command goes to the shell as `-c`, and its argv is quoted for a POSIX shell.
- `^C` and `close` signal a process group with a negative pid. Windows has no process groups.
- `detached: true` on Windows opens a new console, not a new process group.
- VS Code's agent host takes `defaultShell` first, and then `getSystemShell`. On Windows that is the first PowerShell found, PowerShell 7 before Windows PowerShell, and `SHELL` is not read.

### Gaps

- How `^C` stops a command under pipes on Windows. Task 03 step 1 tries `taskkill /T` on the runner.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The plan makes terminals work on Windows, and the terminal tests run there | Softov, 2026-10-16, chose "Make terminals work" for "What do the terminal tests do on Windows?" | 01, 02, 03, 04 |
| On Windows the shell is `defaultShell`, then `pwsh.exe` of PowerShell 7, then Windows PowerShell; `SHELL` is not read | (defaulted: VS Code's `getSystemShell` order, less the preview, MSIX, dotnet and Scoop installs) | 01 |
| `cmd.exe` from `ComSpec` is used only where no PowerShell is found | (defaulted: VS Code reads `ComSpec` only off Windows; a host with no PowerShell still gets a shell) | 01 |
| A command runs as `-NoProfile -Command`, and an argv is quoted for PowerShell | (defaulted: the PowerShell form of `-c`) | 02 |
| `close` ends the shell's process tree with `taskkill /T /F` | (defaulted: Windows has no process group to signal) | 03 |

## Proposed architecture

- **Data flow:** `createTerminal` -> `shellOf` picks the shell for the system -> the arguments for that shell -> spawn with `windowsHide` -> `^C` and `close` end the tree.
- **Layer responsibilities:** sdk only. `terminals.ts` holds a shell's arguments and quoting, and how its tree stops.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A terminal picks a Windows shell](task-01-a-terminal-picks-a-windows-shell.md) | done | - |
| [02 - A command runs in PowerShell](task-02-a-command-runs-in-powershell.md) | done | 01 |
| [03 - A terminal stops on Windows](task-03-a-terminal-stops-on-windows.md) | done | 02 |
| [04 - The terminal tests run on Windows](task-04-the-terminal-tests-run-on-windows.md) | done | 03 |

## Risks and tradeoffs

- Under pipes, PowerShell prints no OSC 133 marks either, so command boundaries stay unknown, as on POSIX.
- A command line from the composer is PowerShell syntax on Windows. A line written for `sh` fails there, as it does in VS Code.

## Resume state

- **Done so far:** planned 2026-10-16 with Softov's answer. Tasks 01, 02 and 03 implemented 2026-10-16, and task 04 on 2026-10-19. `shellOf` picks the Windows shell. A command reaches PowerShell as `-NoProfile -Command`, `cmd.exe` as `/d /s /c`, and a POSIX shell as `-c`. `^C` and `close` end the shell's tree on Windows with `taskkill /pid <pid> /T /F`. Every terminal test passes on Softov's Windows machine, with no skip. On 2026-10-19 the `check-windows` job of PR #30 passed, in run 39344018005. Softov approved the close on 2026-10-19. The plan is built: see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none. Task 03 step 1 was answered on Windows 2026-10-18: `taskkill /pid <pid> /T` without `/F` stops nothing under pipes, so `^C` and `close` keep `/T /F`.
- **Watch out for:** under `shell: bash` on the runner, `SHELL` names a Git Bash path. On Windows it is not read. A command line from the composer is PowerShell syntax on Windows.

## Final verification checklist

- [x] A test on Windows: a terminal with no `defaultShell` runs PowerShell, and `echo` prints.
- [x] A test on Windows: `^C` stops a long command, and `close` ends its tree.
- [x] The Linux tests pass with the same shell as before.
- [x] The Windows job passes the terminal tests, with no skip.
