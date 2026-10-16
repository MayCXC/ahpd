---
title: The terminal tests run on Windows
status: todo
depends: [task-03-a-terminal-stops-on-windows.md]
layer: sdk
refs:
  - "[code://packages/sdk/test/wire.test.ts#L299](../../../../packages/sdk/test/wire.test.ts#L299) - a host test with `shellTerminals()`"
  - "[code://packages/sdk/test/users-gate-dispatch.test.ts#L25](../../../../packages/sdk/test/users-gate-dispatch.test.ts#L25) - another"
---

## Objective

The tests that start a real terminal pass on Windows.
A command in them is one that PowerShell and a POSIX shell both run.

## Files

- `UPDATE: packages/sdk/test` - each file in p1's list that fails on a terminal.

## Steps

1. Take the files in p1's list that start `shellTerminals`.
2. Find the command line each test sends.
3. Use a command both shells run, such as `echo`, or pick one by system.
4. Compare output with line ends removed, because PowerShell writes `\r\n`.
5. Run the sdk tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The Windows job passes these files, with no skip.
- The sdk tests pass on Linux.

## Resume
