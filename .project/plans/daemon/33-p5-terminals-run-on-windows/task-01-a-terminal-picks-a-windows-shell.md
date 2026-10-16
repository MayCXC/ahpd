---
title: A terminal picks a Windows shell
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/terminals.ts#L19](../../../../packages/sdk/src/terminals.ts#L19) - `shellOf`"
  - "[code://packages/sdk/src/terminals.ts#L47](../../../../packages/sdk/src/terminals.ts#L47) - the title"
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/base/node/powershell.ts#L250-L304 - the PowerShell order
---

## Objective

On Windows, `shellOf` answers the asked shell, then PowerShell 7, then Windows PowerShell, then `ComSpec`.
It does not read `SHELL` there.
Off Windows it answers as now.

## Files

- `UPDATE: packages/sdk/src/terminals.ts:19` - the Windows branch.
- `UPDATE: packages/sdk/src/terminals.ts:47` - the title from `basename`, so a `\` path gives `pwsh.exe`.
- `UPDATE: packages/sdk/test` - `shellOf` with a fake environment and file check.

## Steps

1. Look for `pwsh.exe` under `%ProgramFiles%\PowerShell\7`, and then on `PATH`.
2. Look for `powershell.exe` under `%SystemRoot%\System32\WindowsPowerShell\v1.0`.
3. Fall back to `ComSpec`, and then to `cmd.exe`.
4. Find the shell once, and keep the answer.
5. Take the title from `basename` of the shell.
6. Write the tests, with the environment and the file check passed in.
7. Set this task and the plan row to `implemented`.

## Validation

- A test: on `win32` with PowerShell 7 present, the shell is its `pwsh.exe`.
- A test: on `win32` with no PowerShell, the shell is `ComSpec`.
- A test: on `win32`, `SHELL` does not change the answer.
- A test: off Windows, the answer is `SHELL` or `/bin/sh`, as before.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
