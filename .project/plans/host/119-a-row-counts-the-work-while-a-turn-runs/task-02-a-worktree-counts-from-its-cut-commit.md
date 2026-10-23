---
title: A worktree counts from its cut commit
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L1018-L1034](../../../../packages/sdk/src/host/lifecycle.ts#L1018-L1034) - the tree is made and the record is written"
  - "[code://packages/sdk/src/types/sessions.ts#L63-L68](../../../../packages/sdk/src/types/sessions.ts#L63-L68) - `StoredWorktree`"
  - "[code://packages/sdk/src/sessions/sessions.ts#L321-L332](../../../../packages/sdk/src/sessions/sessions.ts#L321-L332) - the record read back from disk"
  - "[code://packages/sdk/src/host/catalogue.ts#L655](../../../../packages/sdk/src/host/catalogue.ts#L655) - `branchSummary` is given the base's name"
  - "[code://packages/sdk/src/host/changesets.ts#L80-L83](../../../../packages/sdk/src/host/changesets.ts#L80-L83) - `baseOf`, the base the branch scope reads"
  - "[code://packages/sdk/src/sessions/changes.ts#L1439-L1443](../../../../packages/sdk/src/sessions/changes.ts#L1439-L1443) - the branch scope's fork point"
  - "[code://packages/sdk/src/sessions/changes.ts#L905-L918](../../../../packages/sdk/src/sessions/changes.ts#L905-L918) - `mergeBaseOf` takes a full commit as it is"
---

## Objective

A worktree session counts from the commit its tree was cut from.
A commit that was on the local base and not pushed is not the session's work.

## Files

- `UPDATE: packages/sdk/src/types/sessions.ts:63-68` - `StoredWorktree` gains `commit?`, the commit the tree was cut from.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1029-1034` - read `HEAD` in the new tree and keep it as `commit`.
- `UPDATE: packages/sdk/src/sessions/sessions.ts:321-332` - read `commit` back, as a full commit or nothing.
- `UPDATE: packages/sdk/src/host/catalogue.ts:655` - give `branchSummary` the commit where the record has one.
- `UPDATE: packages/sdk/src/host/changesets.ts:80-83` - the branch scope's diff uses the same commit.
- `UPDATE: packages/sdk/test/changes-branch.test.ts` - a worktree cut from an unpushed commit.
- `UPDATE: CHANGELOG.md` - a worktree counts from the commit it was cut from.

## Steps

1. Add `commit?: string` to `StoredWorktree`, with a comment.
2. After `port.create`, read `git rev-parse HEAD` in the new tree, and add it to `made`.
3. Read `commit` back from disk only when it is 40 hex characters.
4. Give `branchSummary` the record's `commit`, or the base's name where there is none.
5. Give the branch scope's diff the same value, so its rows and the row's counts agree.
6. Keep the base's name for the pull request and for `baseBranchName`.
7. Leave the unarchive restore as it is, because it keeps the record.
8. Add the tests to `changes-branch.test.ts`.
9. Update the CHANGELOG.
10. Set this task and its plan row to `implemented`.

## Validation

- A local `main` one commit ahead of `origin/main`: a worktree cut from it counts only the session's own edits.
- The branch scope's rows and the row's counts agree for that worktree.
- A record with no `commit` counts from `origin/<base>`, as now.
- A pull request from that worktree still names `main` as its base.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm test` pass.

## Resume

