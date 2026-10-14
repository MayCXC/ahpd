---
title: An archived session gives back its worktree
domain: host
status: planned
priority: medium
created: 2026-10-14
revalidated: 2026-10-14
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L887-L955](../../../../packages/sdk/src/host/lifecycle.ts#L887-L955) - `isolated`, which makes the tree and keeps its record in the `worktrees` map only"
  - "[code://packages/sdk/src/host/lifecycle.ts#L218-L247](../../../../packages/sdk/src/host/lifecycle.ts#L218-L247) - `teardown`, which removes a clean tree with its branch and keeps a dirty one"
  - "[code://packages/sdk/src/host/chatactions.ts#L27-L45](../../../../packages/sdk/src/host/chatactions.ts#L27-L45) - `sessionFlag`, where an archive only queues `ctx.sleep`"
  - "[code://packages/sdk/src/host/sleep.ts#L128-L167](../../../../packages/sdk/src/host/sleep.ts#L128-L167) - `sleep` and `archived`; the sweep sleeps an archived session at once"
  - "[code://packages/sdk/src/host/vscodemethods.ts#L288-L317](../../../../packages/sdk/src/host/vscodemethods.ts#L288-L317) - `vscode/setAgentHostDetachedWorktreeArchived`, the sibling: remove a clean tree, keep the branch, put it back"
  - "[code://packages/sdk/src/repo/worktrees.ts#L129-L202](../../../../packages/sdk/src/repo/worktrees.ts#L129-L202) - `create` checks out an existing branch when no new branch is named; `remove` deletes the branch it is given"
  - "[code://packages/sdk/src/types/sessions.ts#L260-L268](../../../../packages/sdk/src/types/sessions.ts#L260-L268) - `remoteOrigin`, the optional store field to mirror"
  - "[code://packages/sdk/src/sessions.ts#L330-L390](../../../../packages/sdk/src/sessions.ts#L330-L390) - `Row`, `empty` and `Saved`, where a new field is kept"
  - "[code://packages/sdk/test/worktrees.test.ts#L824-L975](../../../../packages/sdk/test/worktrees.test.ts#L824-L975) - the teardown tests and the detached archive test to mirror"
  - "[code://packages/sdk/src/types/worktrees.ts#L128-L143](../../../../packages/sdk/src/types/worktrees.ts#L128-L143) - `dirty` and `remove` on the `Worktrees` port, which has no commit"
  - "[code://packages/server/src/rootconfig.ts#L32-L40](../../../../packages/server/src/rootconfig.ts#L32-L40) - `DAEMON_KEYS` and `LIVE`, where `closedChats` is a key a client edits and the daemon applies at once"
  - "[code://packages/sdk/src/host/actions.ts#L470-L477](../../../../packages/sdk/src/host/actions.ts#L470-L477) - how a push of `closedChats` changes the host while it runs"
  - "git://github.com/microsoft/vscode@c289a58900a - `worktreeIsolation.ts` `cleanupWorktreeOnArchive` and `recreateWorktreeOnUnarchive`, called from `agentSideEffects.ts` on `SessionIsArchivedChanged`"
---

## Goal

Archiving a session removes its clean worktree and keeps the branch.
Unarchiving puts the tree back at the same path on the same branch.
A tree with changes nobody committed stays where it is by default.
The daemon key `archiveDirtyWorktree` set to `commit` commits those changes, then removes the tree.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "worktrees\.(set|delete|get)" packages/sdk/src` - `isolated` sets the record, and `teardown`, the move and the detached methods read or drop it. Nothing stores it.
- `rg "IsArchived" packages/sdk/src/host` - `sessionFlag` queues a sleep, and the sweep sleeps an archived session.
- `rg "deletedInside" packages/sdk/src/host/lifecycle.ts` - a sleeping session is deleted without `teardown`, so its tree is not removed.

### Runtime path

```
client session/isArchivedChanged true -> actions.ts -> sessionFlag -> ctx.sleep -> tree left on disk
client session/isArchivedChanged false -> sessionFlag -> (nothing about the tree)
daemon restart -> worktrees map empty -> teardown finds no tree
```

### Gaps

- The worktree record lives in memory only. After a restart no path knows the tree of a session.
- Archive does not touch the tree.
- `Worktrees.remove` deletes the branch when it is given one, so the archive must call it without the branch.
- Deleting a sleeping session goes through `deletedInside` and leaves the tree. This plan does not change that.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The worktree record is kept in the session store, beside the flags | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream c289a58900a) | 01 |
| An archived session's clean tree is removed when the session sleeps, and its branch stays | Softov, 2026-10-14, chose "Record and plan" for Pass 6 | 02 |
| The daemon key `archiveDirtyWorktree` picks what archive does with a dirty tree: `keep`, the default, or `commit` | Softov, 2026-10-14, chose "configurable, default keep as dirty" for "What does archive do with a tree that has changes nobody committed?" | 03 |
| Under `keep`, a dirty tree stays on archive, and the log names it | Softov, 2026-10-14, chose "configurable, default keep as dirty" for "What does archive do with a tree that has changes nobody committed?" | 02 |
| Under `commit`, archive commits every change with the message "Saving uncommitted changes before archiving session", then removes the tree and keeps the branch | Softov, 2026-10-14, chose "configurable, default keep as dirty" for "What does archive do with a tree that has changes nobody committed?" (defaulted: upstream c289a58900a) | 03 |
| A push of `archiveDirtyWorktree` applies at once, as a push of `closedChats` does | Softov, 2026-10-14, chose "configurable, default keep as dirty" for "What does archive do with a tree that has changes nobody committed?" (defaulted: proposed, mirrors `closedChats`) | 03 |
| A failed commit keeps the tree, and the log says why | Softov, 2026-10-14, chose "configurable, default keep as dirty" for "What does archive do with a tree that has changes nobody committed?" (defaulted: proposed) | 03 |
| A tree on a detached `HEAD`, with no branch of its own, stays on archive | Softov, 2026-10-14, "What does archive do with a tree on a detached `HEAD`, with no branch of its own?" (defaulted: proposed, unarchive cannot put it back on the same commit) | 02 |
| A wake of an archived session whose tree is gone restores the tree first, as unarchive does | Softov, 2026-10-14, "What happens when a client wakes an archived session whose tree is gone?" (defaulted: proposed) | 02 |
| Unarchive puts the tree back at the stored path on the stored branch, and links the symlink folders again | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream c289a58900a) | 02 |
| Unarchive does not copy the include files again | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream c289a58900a) | 02 |
| A tree that still exists on unarchive is left alone; a branch that is gone fails with a log line | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream c289a58900a) | 02 |
| The removal and the restore of one session run one after the other | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream c289a58900a) | 02 |
| A tree held by a detached handle is left to the `vscode/setAgentHostDetachedWorktreeArchived` method | Softov, 2026-10-14, chose "Record and plan" for Pass 6 | 02 |

## Proposed architecture

- **Data flow** - `isolated` writes the record to the map and to the store. Every reader asks the map, then the store.
- **Event flow** - archive sleeps the session as today. When `sleep` stops an archived session, it removes the tree. Unarchive restores the tree before it says anything else.
- **State flow** - the store holds `{ repository, path, base, branch? }` per session. The record stays after an archive, because unarchive needs it.
- **Layer responsibilities** - The sdk holds the store field and the record reads and writes. It holds `shelve` and `restore` in `lifecycle.ts`, and the calls from `sleep.ts` and `chatactions.ts`. It also holds the `archiveDirtyWorktree` option and `commit` on the `Worktrees` port. The server holds the key in the configuration, the flags and the root config.
- **Source-of-truth files** - [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts), [`code://packages/sdk/src/sessions.ts`](../../../../packages/sdk/src/sessions.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The worktree record outlives the daemon](task-01-the-worktree-record-outlives-the-daemon.md) | todo | - |
| [02 - Archive shelves the tree and unarchive restores it](task-02-archive-shelves-the-tree-and-unarchive-restores-it.md) | todo | 01 |
| [03 - A daemon key decides what archive does with a dirty tree](task-03-a-daemon-key-decides-what-archive-does-with-a-dirty-tree.md) | todo | 02 |

## Risks and tradeoffs

- Upstream always commits the changes of a dirty tree, then removes it. Here that is `commit`, and the default `keep` never frees a dirty tree.
- Under `commit`, the commit lands on the session's branch with the host's git identity. A person who did not expect it sees a commit nobody wrote.
- A branch checked out in another tree makes `git worktree add` fail on unarchive. The session stays unarchived, and the log says why.
- A tree removed on archive is gone for a client that opens the archived session without unarchiving it. A wake restores the tree first.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-worktree-record-outlives-the-daemon.md](task-01-the-worktree-record-outlives-the-daemon.md).
- **Open questions:** none.
- **Watch out for:** the move path at `lifecycle.ts` L570-L585 and the detached methods also drop the record. Each one must drop the stored copy too.

## Final verification checklist

- [ ] A test: the record is read back after a store reopen, and `teardown` uses it.
- [ ] A test: archiving a clean session removes the tree and keeps the branch.
- [ ] A test: under `keep`, archiving a dirty session keeps the tree.
- [ ] A test: under `commit`, archiving a dirty session commits the changes on the branch and removes the tree.
- [ ] A test: the key is in the root config schema, and a push of it applies with no restart.
- [ ] `docs/HOST.md` lists `archiveDirtyWorktree`.
- [ ] A test: unarchiving puts the tree back on the branch, with the symlinks.
- [ ] A test: archive then unarchive at once leaves the tree in place.
- [ ] The gates pass: typecheck, boundary, schema and vitest.
- [ ] `plans/index.md` updated.
