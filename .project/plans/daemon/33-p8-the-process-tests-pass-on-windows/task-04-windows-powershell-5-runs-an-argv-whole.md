---
title: Windows PowerShell 5.1 runs an argv whole
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L134-L153](../../../../packages/sdk/src/machines/terminals.ts#L134-L153) - `crtEscaped` and `isWindowsPowerShell`"
  - "[code://packages/sdk/src/machines/terminals.ts#L212-L227](../../../../packages/sdk/src/machines/terminals.ts#L212-L227) - `argvLine`"
  - "[code://packages/sdk/test/pty.test.ts#L159](../../../../packages/sdk/test/pty.test.ts#L159) - the line given to each PowerShell"
---

## Objective

A terminal started with an argv under Windows PowerShell 5.1 hands the program each word whole, by decision 1.

## Files

- `UPDATE: packages/sdk/src/machines/terminals.ts` - `crtEscaped(word)`, `isWindowsPowerShell(shell)`, and `argvLine(kind, argv, windowsPowerShell)`, which escapes the words after the program for `powershell.exe`.
- `UPDATE: packages/sdk/test/pty.test.ts` - a case for the line `powershell.exe` and `pwsh.exe` are given.

## Steps

1. Write `crtEscaped`: an empty word is `""`; a `"` gets its preceding backslashes doubled and one more in front of it; a word with whitespace gets its trailing backslashes doubled.
2. Write `isWindowsPowerShell`, read from the shell's file name as `kindOf` reads it.
3. In `argvLine`, quote the program as before, and the other words through `crtEscaped` first when the shell is Windows PowerShell.
4. Add the case: `powershell.exe` given a quote, a backslash before a quote, a trailing backslash in a word with a space, an empty word and a plain one; `pwsh.exe` given a quote as it is.
5. Run `pty.test.ts` on the Windows VM and on this host.

## Validation

- `pty.test.ts`: the new case passes on every system.
- On the Windows VM, whose shell is Windows PowerShell 5.1: "runs an argv, so an argument with a space arrives whole" passes.
- The Linux jobs pass.

## Resume

Done 2026-10-20. Not reviewed.
Before, on the VM: "runs an argv, so an argument with a space arrives whole" failed, with `?? ")` and a syntax error from node.
On the Windows VM, from `main` at `8ad65e71` with this change copied over, whose shell is Windows PowerShell 5.1: `pty.test.ts` passes 27 of 27, the new case among them.
On this host, whose shell is PowerShell 7, the file passes too.
