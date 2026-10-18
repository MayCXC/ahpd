---
title: A terminal picks a Windows shell
status: implemented
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

Implemented. `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs`, `git diff --quiet tools/` and `pnpm -s exec vitest run packages/sdk` pass.

Files changed:
- `packages/sdk/src/terminals.ts` - `windowsShell` reads `%ProgramFiles%\PowerShell\7\pwsh.exe`, then `pwsh.exe` on `PATH`, then `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`, then `ComSpec`, then `cmd.exe`. `shellOf` is exported. It takes the asked shell, the platform, the environment and the file check. It reads `SHELL` only off Windows. The title comes from `basename`.
- `packages/sdk/test/pty.test.ts` - seven cases. PowerShell 7 installed. PowerShell 7 on `PATH`. The Windows PowerShell. `ComSpec` and then `cmd.exe`. `SHELL` not read. `SHELL` then `/bin/sh` off Windows. The asked shell wins on either system.

Past the Files section, and why:
- `shellOf` also takes the platform. The task names the environment and the file check. Without the platform, a build that runs on Linux cannot exercise the Windows branch at all. The Validation asks for four cases on `win32`. `packages/server/src/install.ts`'s `launch` is the same shape.
- `packages/sdk/src/host/terminals.ts:86`, `docs/sdk/TERMINALS.md:45` and `docs/sdk/USERS.md:378` each said the daemon's shell is `$SHELL` and then `/bin/sh` and no more, which the Windows branch makes false.

The suite rewrote `packages/sdk/test/fixtures/wire.jsonl` (the endpoint line and the `ahpd.` `_meta` lines). The restore was denied here, so Softov reverts it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.

`pnpm -s exec vitest run packages/sdk` on a loaded box timed out three machine tests at 5s; `--maxWorkers=2 --testTimeout=10000` passes all 2997.
