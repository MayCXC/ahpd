---
title: The paths the Windows run found
status: implemented
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

## Resume

Done 2026-10-18. Not reviewed.

`sessiontools.test.ts` needed no change. Task 02 had already built the spaced folder with `join(tmpdir(), ...)` and its URIs with `uriOf` after the Windows run at `71166379` that this task cites. The three workspace forms the case sends all resolve to one path under Node's Windows rules, checked through `pathToFileURL` and `fileURLToPath` with the `windows` option.
`config-layers.test.ts` expects `resolve('/trees')` in place of the literal `/trees`, because `options.ts` resolves a typed root and Windows answers the current drive's root instead of `/`.

Gates run: `pnpm -s schema`, `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
Vitest on `config-layers.test.ts` and `sessiontools.test.ts` with `--maxWorkers=2 --testTimeout=10000`: 47 tests pass.

The Windows half of Validation cannot run here: this host is Linux and the `check-windows` job is not built. A run of p1's job, or Softov's Windows machine, is the check for both cases.
