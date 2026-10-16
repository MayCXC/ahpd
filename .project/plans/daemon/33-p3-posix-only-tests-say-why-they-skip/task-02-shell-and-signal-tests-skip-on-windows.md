---
title: Shell and signal tests skip on Windows
status: todo
depends: [task-01-one-helper-names-a-posix-only-case.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/terminals.ts#L19](../../../../packages/sdk/src/terminals.ts#L19) - `shellOf`"
  - "[code://packages/sdk/test/nested-process.test.ts#L90](../../../../packages/sdk/test/nested-process.test.ts#L90) - `sh -c`"
  - "[code://packages/sdk/test/pty.test.ts#L192](../../../../packages/sdk/test/pty.test.ts#L192) - a process group"
---

## Objective

A test that starts `sh` outside a terminal, or sends a POSIX signal, skips on Windows with its reason.
A test that starts `shellTerminals` is left to p5.
A test that names `/bin/sh` only as a value runs on both systems.

## Files

- `UPDATE: packages/sdk/test` - each file in p1's list that fails on `sh` or on a signal.

## Steps

1. Take the files in p1's list that fail on `sh` or on a signal.
2. Find the cases in each file that start `sh` or send a signal.
3. Skip each one with `it.skipIf(!posix)`.
4. Write the reason beside each skip: a POSIX shell or a process group.
5. Leave a case that passes `/bin/sh` as a value unchanged.
6. Run the sdk tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The Windows job passes these files, and its log counts the skips.
- The sdk tests on Linux skip nothing new.

## Resume
