---
title: A command runs in PowerShell
status: done
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

Implemented. `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs`, `git diff --quiet tools/` and `pnpm -s exec vitest run packages/sdk` pass, 3001 tests.

Files changed:
- `packages/sdk/src/terminals.ts` - `kindOf` names the kind from the shell's file name (`pwsh`/`pwsh.exe`/`powershell`/`powershell.exe`, `cmd`/`cmd.exe`, everything else POSIX). `flagOf` gives PowerShell `-NoProfile -Command`, `cmd.exe` `/d /s /c` and a POSIX shell `-c`. `argvLine` quotes each word. PowerShell gets doubled single quotes behind `&`. `cmd.exe` gets double quotes. POSIX gets the form as before. `psQuoted` and `cmdQuoted` sit beside `quoted`. `WINDOWS` is read once. The pipe spawn sets `windowsHide: true` and leaves `detached` off on Windows.
- `packages/sdk/test/pty.test.ts` - four cases. PowerShell with a line and with an argv holding `it's`. `cmd.exe` with a line and with an argv. A POSIX shell with both. No flag at all with no command. The fake pty now records the shell and the argv it was started with, which is where a case reads them.

Two things this task does not decide:
- Nothing checks `windowsHide` or the missing `detached`. Both are options to a real `spawn`. A case here runs on Linux, where the pipe path starts a real process. The Validation names only the arguments.
- A kind is read with the runtime's own `basename`, so a case names a file (`pwsh.exe`) rather than a `C:\...` path. A Windows path splits on Windows, which is the machine the branch is for.

Fixed 2026-10-18: `cmd.exe` was handed a broken line. Node's spawn turns an argv into a Windows command line with backslash escapes for inner quotes, and `cmd.exe` reads no such escape. So `"C:\Program Files\tool.exe"` and a typed `echo "a"` both arrived broken. Both paths now do what Node's own `shell: true` does. The pipe spawn wraps the line in double quotes and sets `windowsVerbatimArguments: true`, which `/s` strips. The pty path hands `node-pty` the whole line as one string, which it passes verbatim on Windows. `packages/sdk/src/types/terminals.ts` widened `SpawnPty`'s args to `string[] | string` for that, and the server's cast and the test fake still fit. A new `SpawnShell` seam, in the style of `RunQuietly`, is how a case reads the pipe spawn's options. PowerShell and POSIX quoting is unchanged. `pty.test.ts` has the one-line `cmd.exe` cases and the new pipe case. The gates and the sdk suite pass, 3006 tests.

The suite rewrote `packages/sdk/test/fixtures/wire.jsonl` again. The restore was denied here, so Softov reverts it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
