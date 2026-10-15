---
title: Stage, unstage and discard take the whole changeset
status: done
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
- `UPDATE: docs/sdk/AHP.md:697-710` - the three take a file or the whole changeset.

## Steps

1. Add `'changeset'` to the scopes of `DISCARD`, `STAGE` and `UNSTAGE`.
2. In `invoke`, read a missing target as the whole directory: the path is `.`.
3. Keep the refusal of a folder for `revert`, and for `discard` with a resource target.
4. For discard with no target, run `git restore --staged --worktree --source=HEAD -- .`, then `git clean -f -- .`.
5. In a repository with no commit, refuse discard with no target, because every file there is new.
6. Answer "Staged every change", "Unstaged every change" or "Discarded every change".

## Validation

- Stage with no target stages tracked and untracked files under the directory, and nothing outside it.
- Unstage with no target leaves the working tree as it was.
- Discard with no target puts tracked files back to HEAD and removes untracked ones, under the directory only.
- A file target works as before.
- The gates pass.

## Resume

- **Implemented** 2026-10-11 on `build/host82`, commit `1316386`.
- `packages/sdk/src/changes.ts:258-286` gives `DISCARD`, `STAGE` and `UNSTAGE` the scopes `['resource', 'changeset']`. The discard confirmation is "Discard these changes? This cannot be undone."
- `packages/sdk/src/changes.ts:1414` reads no target as the whole changeset, with the path `.`. Stage and unstage then run as they do on the session's folder, and answer "Staged every change" and "Unstaged every change".
- `packages/sdk/src/changes.ts:1428-1448` is discard on the whole changeset. It runs `restore --staged --worktree --source=HEAD -- .`, then `clean -f -- .`, and answers "Discarded every change". In a repository with no commit it refuses, with "Nothing to discard to: this repository has no commit yet."
- A folder named as a resource is still refused for discard and revert.
- **Departure 1.** `restore` fails with "did not match" on a folder that holds only untracked files. That failure is not an error, because nothing tracked is there to restore.
- **Departure 2.** `clean` run through `git -C` on a folder that git does not track removes the files, then fails to remove the folder itself. The discard checks `ls-files --others --exclude-standard -- .` after a failed `clean`, and fails only when files are left.
- `packages/sdk/test/commit.test.ts:474` adds 7 tests. They cover the scopes and the confirmation, and stage, unstage and discard under a subfolder. They also cover a folder of untracked files only, a repository with no commit, and the folder refusal.
- Gates: `pnpm build`, `pnpm typecheck` and `pnpm boundary` pass. The sdk suite passes 2760 tests in 141 files, and the server suite passes 901 tests in 46 files.
