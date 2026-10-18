---
title: The paths the Windows run found
status: todo
depends: []
layer: sdk, server
refs:
  - "[code://packages/sdk/test/sessiontools.test.ts#L143](../../../../packages/sdk/test/sessiontools.test.ts#L143) - \"matches a directory with a space\" answers `[]` on Windows"
  - "[code://packages/server/test/config-layers.test.ts#L170](../../../../packages/server/test/config-layers.test.ts#L170) - expects `/trees`, and Windows answers `F:\\trees`"
---

## Objective

The two path cases that the Windows run of 2026-10-18 found pass on Windows.

## Files

- `UPDATE: packages/sdk/test/sessiontools.test.ts:143` - the directory and its URI come from the system.
- `UPDATE: packages/server/test/config-layers.test.ts:170` - the expected root comes from `resolve`.

## Steps

1. Read how `sessiontools.test.ts:143` builds its directory and its URI.
2. Build both with `join` and `uriOf`, as the code under test does.
3. Build the expected `worktreesRoot` in `config-layers.test.ts:170` with `resolve('/trees')`.
4. Run the sdk and server tests.
5. Set this task and the plan row to `implemented`.

## Validation

- Both cases pass on Windows.
- The sdk and server tests pass on Linux.
