---
title: An archive leaves the checkout's linked folders
status: implemented
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/repo/worktrees.ts](../../../../packages/sdk/src/repo/worktrees.ts) - `linksIn`, `remove` and `linkType`"
  - "[code://packages/sdk/test/worktrees.test.ts](../../../../packages/sdk/test/worktrees.test.ts) - \"puts the tree back on its branch on unarchive, with its folders linked again\""
---

## Objective

On Windows, archiving a session whose tree links a folder such as `node_modules` removes the link and leaves the checkout's folder as it was.

## Files

- `UPDATE: packages/sdk/src/repo/worktrees.ts` - `remove` finds the links among the ignored entries too, and the put-back after a refusal makes a junction on Windows.
- `UPDATE: packages/sdk/test/worktrees.test.ts` - the checkout's linked folder is checked after the archive.

## Steps

1. Reproduce: the unarchive test finds no `node_modules` in the restored tree.
2. Find the cause: on Windows the link is a junction, git takes it for a folder that `node_modules/` ignores, `linksIn` reads only untracked lines and finds none, and `git worktree remove` deletes through the junction.
3. Add `--ignored=matching` to the status `remove` reads, and let `linksIn` take `!!` lines as well as `??` lines.
4. Give the put-back after a refused remove the same link type as `link`.
5. Check the checkout's `node_modules/dep/index.js` in the test after the archive.
6. Run the test without the fix and with it.
7. Set this task and the plan row to `implemented`.

## Validation

- The unarchive test passes on Windows, and fails there without the fix.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine, without the fix the test fails at the new check: the checkout's `node_modules/dep/index.js` is gone after the archive.
With it, `worktrees.test.ts` passes: 57 tests.
`dirty` and `commit` need no change: an ignored junction is neither dirty nor staged.
The Linux half of Validation is the CI run of the branch.
