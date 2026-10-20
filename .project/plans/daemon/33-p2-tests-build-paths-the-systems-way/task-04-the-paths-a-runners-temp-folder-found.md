---
title: The paths a runner's temp folder found
status: done
depends: [task-03-the-paths-the-windows-run-found.md]
layer: sdk, tests, examples
refs:
  - "[code://tools/test-tmpdir.ts#L16-L22](../../../../tools/test-tmpdir.ts#L16-L22) - the run's folder, by its long name"
  - "[code://packages/sdk/src/repo/worktrees.ts](../../../../packages/sdk/src/repo/worktrees.ts) - `repository` and `gitDir` answer git's paths in the system's spelling"
  - "[code://examples/echo/agent.ts](../../../../examples/echo/agent.ts) - the echo agent's working directories and command URIs come from `uriOf`"
  - "[code://packages/sdk/test/host-merged.test.ts](../../../../packages/sdk/test/host-merged.test.ts) - the session folder goes in by `uriOf` and comes back by `localPath`"
  - "[code://packages/sdk/test/diagnostics.test.ts](../../../../packages/sdk/test/diagnostics.test.ts) - the state file and log URIs come from `uriOf` and `localPath`"
---

## Objective

The path cases that a Windows runner's temp folder and git's answers expose pass on Windows.

## Files

- `UPDATE: tools/test-tmpdir.ts` - the run's folder is named by `realpathSync.native`.
- `UPDATE: packages/sdk/src/repo/worktrees.ts` - `repository` and `gitDir` pass git's paths through `resolve`.
- `UPDATE: examples/echo/agent.ts` - every hand-built `file://` URI is `uriOf`.
- `UPDATE: packages/sdk/test/worktrees.test.ts` - two `git worktree list` checks compare with forward slashes.
- `UPDATE: packages/sdk/test/host-merged.test.ts` - the folder is sent by `uriOf` and read back by `localPath`.
- `UPDATE: packages/sdk/test/diagnostics.test.ts` - the expected URIs come from `uriOf`, and the answered ones are read by `localPath`.

## Steps

1. Name the run's temp folder by its long name, since a runner's `TEMP` is an 8.3 short name and git answers by the long one.
2. Pass the paths that `repository` and `gitDir` read from git through `resolve`, since git writes a Windows path with forward slashes.
3. Replace each hand-built `file://` URI in the echo agent and the two tests with `uriOf`, and each `slice('file://'.length)` with `localPath`.
4. Run the three test files and the typecheck.
5. Set this task and the plan row to `implemented`.

## Validation

- `worktrees.test.ts`, `host-merged.test.ts` and `diagnostics.test.ts` pass on Windows.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine the three files pass: 87 tests.
`pnpm -s typecheck` passes.
`host-merged.test.ts` has a `uriOf` of its own for echo channels, so the sdk's is imported as `fileUriOf` there.
The Linux half of Validation is the CI run of the branch.

Closed 2026-10-19: the Linux and Windows jobs of PR #30 passed, in run 39344018005.
