---
title: A worktree session has Branch Changes
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/changesets.ts#L390](../../../../packages/sdk/src/host/changesets.ts#L390) - `worktreeOf(uri)?.base`, the base branch"
  - "[code://packages/sdk/src/changes.ts#L1057-L1102](../../../../packages/sdk/src/changes.ts#L1057-L1102) - `scopes`, where the new scope goes"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/common/changesetUri.ts#L63-L64 - the label \"Branch Changes\""
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostGitService.ts#L647-L690 - the merge base that Branch Changes is anchored on"
---

## Objective

A session with `isolation: worktree` offers a `branch` scope, Branch Changes.
It is the diff from the merge base of the base branch to the working tree, with new files counted.

## Files

- `UPDATE: packages/sdk/src/changes.ts:1057-1102` - a `branch` scope with `changeKind: 'branch'` and the label \"Branch Changes\".
- `UPDATE: packages/sdk/src/changes.ts` - `state` and `branchSummary` for `branch`, from `git merge-base` and `git diff --numstat`.
- `UPDATE: packages/sdk/src/types/changes.ts:321-345` - `scopes` takes the base branch, and `ChangesetSource` gets `branchSummary`.
- `UPDATE: packages/sdk/src/host/changesets.ts` - pass `worktreeOf(uri)?.base` to `scopes`.
- `CREATE: packages/sdk/test/changes-branch.test.ts` - the cases in Validation.

## Steps

1. Write the tests first.
2. Offer `branch` only when the session has a worktree with a base branch.
3. Find the merge base of the base branch and `HEAD` with `git merge-base`.
4. Diff the merge base to the working tree, and count untracked files in full.
5. Write `branchSummary` from the same diff.
6. Set this task and the plan row to `implemented`.

## Validation

- A test: a worktree with two commits and one uncommitted file shows all three in Branch Changes.
- A test: a session with `isolation: folder` has no `branch` scope.
- `pnpm -s typecheck` and the sdk vitest suite pass.

## Resume
