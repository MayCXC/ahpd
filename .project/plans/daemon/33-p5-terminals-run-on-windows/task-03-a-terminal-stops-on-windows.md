---
title: A terminal stops on Windows
status: done
depends: [task-02-a-command-runs-in-powershell.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L318-L337](../../../../packages/sdk/src/machines/terminals.ts#L318-L337) - `^C`"
  - "[code://packages/sdk/src/machines/terminals.ts#L369-L385](../../../../packages/sdk/src/machines/terminals.ts#L369-L385) - `close`"
---

## Objective

On Windows, `^C` under pipes stops the running command, and `close` ends the shell's process tree.
Neither one signals a negative pid.

## Files

- `UPDATE: packages/sdk/src/machines/terminals.ts:318-337` - `^C` on Windows.
- `UPDATE: packages/sdk/src/machines/terminals.ts:369-385` - `close` on Windows.

## Steps

1. Try `taskkill /pid <pid> /T` on the runner for a command under pipes, and record what stops in Resume.
2. On Windows, make `^C` end the command's tree with what step 1 found.
3. On Windows, make `close` run `taskkill /pid <pid> /T /F`.
4. Keep the POSIX paths as they are.
5. Keep the guard for a spawn with no pid.
6. Write the tests, with the kill passed in.
7. Set this task and the plan row to `implemented`.

## Validation

- A test: on `win32`, `close` runs `taskkill` with `/T /F` and the shell's pid.
- A test: on `win32`, a spawn with no pid runs no `taskkill`.
- A test: off Windows, `close` sends `SIGKILL` to the group, as before.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume

Implemented. `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs`, `git diff --quiet tools/` and `pnpm -s exec vitest run packages/sdk` pass, 3004 tests.

**Step 1, answered 2026-10-18 on Windows 10 (Node 24.12.0), at `71166379`.**
A shell was started as `createTerminal` starts one: pipes, `windowsHide`, not detached.
It ran a long command: `node -e` with a 60-second timer under `pwsh`, and `ping -n 60` under `pwsh` and under `cmd.exe`.
`taskkill /pid <pid> /T` without `/F` stopped nothing in all three.
Each process in the tree, `conhost.exe` and the command, refused with "This process can only be terminated forcefully (with /F option)".
The shell refused because "one or more child processes of this process were still running".
Three seconds later the shell and its command were all still running.
`taskkill /pid <pid> /T /F` ended the whole tree in all three, and the shell exited with code 1.
So `^C` and `close` both keep `/T /F`, and `endTree` does not change.
E1: `^C` and `close` are the same call on Windows. POSIX's difference between an interrupt and a kill has nothing to draw it with there.

Files changed:
- `packages/sdk/src/machines/terminals.ts` - `RunQuietly` and the real `quietly`. `quietly` is `spawn` with both pipes ignored and an `error` listener. `endTree(pid)` runs `taskkill /pid <pid> /T /F`. `createTerminal` and `shellTerminals` take `platform` and `run`. They read `windows` from the platform, not from `process` once at the top. `^C` and `close` take the Windows branch by pid. The POSIX branches and the no-pid guard are unchanged.
- `packages/sdk/test/pty.test.ts` - three cases. `close` on `win32` runs `taskkill` with `/pid`, the shell's pid (checked to be a live process) and `/T /F`. A spawn with no pid runs no `taskkill`. `close` on `linux` sends `SIGKILL` to a negative pid.

Past the Files section: the tests are not named there, and step 6 asks for them. They are in `pty.test.ts`, beside the case that already covers `close` with no pid.

The suite rewrote `packages/sdk/test/fixtures/wire.jsonl` again. The restore was denied here, so Softov reverts it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
