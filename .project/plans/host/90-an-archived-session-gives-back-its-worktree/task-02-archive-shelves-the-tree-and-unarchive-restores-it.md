---
title: Archive shelves the tree and unarchive restores it
status: todo
depends: [task-01-the-worktree-record-outlives-the-daemon.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L27-L45](../../../../packages/sdk/src/host/chatactions.ts#L27-L45) - `sessionFlag`"
  - "[code://packages/sdk/src/host/sleep.ts#L128-L167](../../../../packages/sdk/src/host/sleep.ts#L128-L167) - `sleep` and `archived`"
  - "[code://packages/sdk/src/host/vscodemethods.ts#L288-L317](../../../../packages/sdk/src/host/vscodemethods.ts#L288-L317) - the detached archive method, the pattern to mirror"
  - "[code://packages/sdk/src/repo/worktrees.ts#L129-L202](../../../../packages/sdk/src/repo/worktrees.ts#L129-L202) - `create` and `remove`"
  - "git://github.com/microsoft/vscode@c289a58900a - `cleanupWorktreeOnArchive` and `recreateWorktreeOnUnarchive`"
---

## Objective

An archived session that sleeps gives back its clean tree and keeps the branch.
An unarchived session gets the tree back at the same path on the same branch.

## Files

- `UPDATE: packages/sdk/src/host/lifecycle.ts:887-955` - add `shelve(uri)` and `restore(uri)` beside `isolated`, chained per session in one promise map.
- `UPDATE: packages/sdk/src/host/sleep.ts:156-163` - after an archived session has stopped, call `shelve`.
- `UPDATE: packages/sdk/src/host/chatactions.ts:42-43` - on unarchive, call `restore` before any wake.
- `UPDATE: packages/sdk/src/host/sleep.ts:331-345` - `wake` of a session that is still archived calls `restore` before `resume`.
- `UPDATE: packages/sdk/test/worktrees.test.ts` - the cases in Validation, beside "takes a clean worktree away with the session" (L824).

## Steps

1. Write the tests first.
2. `shelve` does nothing without a record or a tree, for a detached handle's tree, or for a running session.
3. `shelve` keeps a dirty tree and logs "kept <path>: it has changes nobody committed". Task 03 adds the `commit` choice.
4. `shelve` calls `remove(repository, path)` with no branch, so the branch stays.
5. `restore` skips a session with no record and a tree that exists.
6. `restore` calls `create` with `base` set to the stored branch, and the symlink folders from the stored session config.
7. `shelve` keeps a tree on a detached `HEAD` with no branch of its own, and logs why.
8. A wake of an archived session calls `restore` before the agent starts.

## Validation

- A test: archive a clean session; when it sleeps, the tree is gone and `git branch` lists the branch.
- A test: archive a dirty session; the tree stays and the log names it.
- A test: unarchive; the tree is back on the branch, and the symlink folder points to the repository again.
- A test: archive and unarchive in one tick; the tree exists at the end.
- A test: a session held by a detached handle keeps its tree on `session/isArchivedChanged`.
- A test: archive a session on a detached `HEAD`; the tree stays and the log says why.
- A test: wake an archived session whose tree is gone; the tree is back before the agent starts.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Not started.
