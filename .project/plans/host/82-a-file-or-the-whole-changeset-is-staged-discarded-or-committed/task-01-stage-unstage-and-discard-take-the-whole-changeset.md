---
title: Stage, unstage and discard take the whole changeset
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/changes.ts#L258-L285](../../../../packages/sdk/src/changes.ts#L258-L285) - `DISCARD`, `STAGE` and `UNSTAGE`"
  - "[code://packages/sdk/src/changes.ts#L1366-L1432](../../../../packages/sdk/src/changes.ts#L1366-L1432) - the three in `invoke`, each on one path"
---

## Objective

Stage, unstage and discard take one file or the whole changeset.
A call with no target acts on every change in the changeset's directory.

## Files

- `UPDATE: packages/sdk/src/changes.ts:258-285` - `scopes: ['resource', 'changeset']` on the three; the discard confirmation becomes "Discard these changes? This cannot be undone."
- `UPDATE: packages/sdk/src/changes.ts:1366-1432` - with no target, the path is `.`, and a folder is allowed for discard.
- `UPDATE: packages/sdk/test/commit.test.ts` - each of the three with no target, over a real repository.
- `UPDATE: docs/AHP.md:697-710` - the three take a file or the whole changeset.

## Steps

1. Add `'changeset'` to the scopes of `DISCARD`, `STAGE` and `UNSTAGE`.
2. In `invoke`, read a missing target as the whole directory: the path is `.`.
3. Keep the refusal of a folder for `revert`, and for `discard` with a resource target.
4. For discard with no target, run `git restore --staged --worktree --source=HEAD -- .`, then `git clean -f -- .`.
5. In a repository with no commit, discard with no target runs `git rm --cached -r -q -- .`, then `git clean -f -- .`.
6. Answer "Staged every change", "Unstaged every change" or "Discarded every change".

## Validation

- Stage with no target stages tracked and untracked files under the directory, and nothing outside it.
- Unstage with no target leaves the working tree as it was.
- Discard with no target puts tracked files back to HEAD and removes untracked ones, under the directory only.
- A file target works as before.
- The gates pass.
