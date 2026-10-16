---
title: A terminal stops on Windows
status: todo
depends: [task-02-a-command-runs-in-powershell.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/terminals.ts#L318-L337](../../../../packages/sdk/src/terminals.ts#L318-L337) - `^C`"
  - "[code://packages/sdk/src/terminals.ts#L369-L385](../../../../packages/sdk/src/terminals.ts#L369-L385) - `close`"
---

## Objective

On Windows, `^C` under pipes stops the running command, and `close` ends the shell's process tree.
Neither one signals a negative pid.

## Files

- `UPDATE: packages/sdk/src/terminals.ts:318-337` - `^C` on Windows.
- `UPDATE: packages/sdk/src/terminals.ts:369-385` - `close` on Windows.

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
