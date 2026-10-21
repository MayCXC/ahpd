---
title: An archived session gives back its worktree - implemented
date: 2026-10-15
refs:
  - git://849e245b
  - "[code://packages/sdk/src/host/lifecycle.ts](../../../../packages/sdk/src/host/lifecycle.ts)"
  - "[code://packages/sdk/src/sessions/sessions.ts](../../../../packages/sdk/src/sessions/sessions.ts)"
  - "[code://packages/sdk/src/repo/worktrees.ts](../../../../packages/sdk/src/repo/worktrees.ts)"
---

An archived session gives back its worktree and keeps its branch, and unarchive puts the tree back.
The worktree record is in the session store, so it outlives the daemon.

## What was built

- [`code://packages/sdk/src/sessions/sessions.ts`](../../../../packages/sdk/src/sessions/sessions.ts) - both stores keep `worktree`, a `StoredWorktree`.
- [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - `worktreeOf` reads the map, then the store.
- [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - `shelve` and `restore`, chained per session. `offBranch` keeps a tree whose `HEAD` is detached or on another branch, on archive and on delete.
- [`code://packages/sdk/src/host/sleep.ts`](../../../../packages/sdk/src/host/sleep.ts) - an archived session is shelved after it stops, and a wake restores the tree first.
- [`code://packages/sdk/src/repo/worktrees.ts`](../../../../packages/sdk/src/repo/worktrees.ts) - `head`, `commit`, and the linked folders in `dirty` and `remove`.
- The daemon key `archiveDirtyWorktree`, `keep` or `commit`, applies with no restart. `docs/sdk/HOST.md` lists it.

## Verified

- `worktrees.test.ts` and `sessions.test.ts` have the cases of the checklist, and two delete cases for the `HEAD` check.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- Vitest on sdk, server, agent-claude and agent-acp passes 4530 tests. `nested-start` failed once under load and passed alone.

## Departures from the plan

- Delete runs the `HEAD` check of archive too, by Softov's answer of 2026-10-15.

## Left for later

- See [deferred.md](deferred.md).
