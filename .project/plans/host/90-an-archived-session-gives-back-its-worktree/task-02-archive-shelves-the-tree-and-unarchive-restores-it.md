---
title: Archive shelves the tree and unarchive restores it
status: implemented
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

### Built

- `shelve` removes the tree of an archived session after its agents close, and it keeps the branch.
- `shelve` keeps a dirty tree, a tree with no branch of its own, and a tree the window holds a handle on.
- `shelve` checks again after the dirty check, so an unarchive or a wake in that time keeps the tree.
- `restore` puts the tree back at its path on its branch, and it links the symlink folders again.
- Unarchive calls `restore`, and every wake calls `restore` before `resume`.
- An archive of a session that is not live gives its tree back at once.
- One promise chain per session orders `shelve` and `restore`.
- `shelve` keeps a tree with a detached `HEAD` or another branch, and a tree whose port has no `head` call.
- The `Worktrees` port has an optional `head` call, and the git port reads it with `git symbolic-ref`.
- `dirty` and `remove` take the linked folder names, and an untracked link at one of those names is not work.
- `remove` takes the links out before `git worktree remove`, and it puts them back when git refuses.
- Delete, the move, archive and the detached handle methods pass the linked folder names too.
- Delete applies the `HEAD` check of archive to a tree with a recorded branch, and it logs the same words.

### Validation

- `worktrees.test.ts` has ten cases for archive, unarchive, wake, a race, a handle, a detached checkout and two git failures.
- A failed restore leaves the session unarchived, and a failed remove leaves the tree, and the log says why.
- The cases fail when `shelve` skips the dirty check, when `restore` does nothing, and without the later checks.
- New cases keep a tree with a commit on a detached `HEAD`, and a tree on another branch.
- A new case keeps the tree when the port has no `head` call.
- New cases use `node_modules/` in `.gitignore`, and archive and delete remove a clean tree with its links.
- A refused removal leaves the untracked file and puts back both links.
- The `HEAD` cases fail without the check, and the link case fails without the link restore.
- Two delete cases keep a tree with a commit on a detached `HEAD`, and a tree on another branch.
- The two delete cases fail when `teardown` skips the `HEAD` check.

### Seen and not done

- After a restart, the host does not know the linked folders, so a tree with links stays on archive and on delete.
- After a restart, `restore` does not link the folders again, for the same reason.
- A delete still removes a clean tree with no recorded branch without a `HEAD` check, as main does.
- Every wake calls `restore`, which does nothing when the tree is present or the session has no record.
