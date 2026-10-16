---
title: A command runs in PowerShell
status: todo
depends: [task-01-a-terminal-picks-a-windows-shell.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/terminals.ts#L27](../../../../packages/sdk/src/terminals.ts#L27) - `quoted`"
  - "[code://packages/sdk/src/terminals.ts#L92-L96](../../../../packages/sdk/src/terminals.ts#L92-L96) - the arguments"
  - "[code://packages/sdk/src/terminals.ts#L184-L200](../../../../packages/sdk/src/terminals.ts#L184-L200) - the spawn"
---

## Objective

A command goes to PowerShell as `-NoProfile -Command`, and to `cmd.exe` as `/d /s /c`.
An argv is quoted for that shell.
The spawn opens no console window.

## Files

- `UPDATE: packages/sdk/src/terminals.ts:27` - quoting for PowerShell and for `cmd.exe`, beside the POSIX one.
- `UPDATE: packages/sdk/src/terminals.ts:92-96` - the arguments for the shell's kind.
- `UPDATE: packages/sdk/src/terminals.ts:184-200` - `windowsHide: true`, and no `detached` on Windows.

## Steps

1. Name the shell's kind from its file name: PowerShell, `cmd.exe` or POSIX.
2. Give PowerShell `-NoProfile -Command`, and a line as it arrived.
3. Quote a PowerShell argv word in single quotes, with each quote doubled, after `&`.
4. Give `cmd.exe` `/d /s /c`, and quote a word in double quotes.
5. Set `windowsHide: true`, and leave `detached` off on Windows.
6. Write the tests of the arguments for each kind.
7. Set this task and the plan row to `implemented`.

## Validation

- A test: PowerShell gets `-NoProfile -Command`, and `it's` arrives as `'it''s'`.
- A test: `cmd.exe` gets `/d /s /c`.
- A test: a POSIX shell gets `-c`, as before.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
