---
title: An inactive merged session is archived
status: done
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/vscoderootconfig.ts#L253-L266](../../../../packages/sdk/src/vscoderootconfig.ts#L253-L266) - the two keys"
  - "[code://packages/sdk/src/host/sleep.ts#L63-L80](../../../../packages/sdk/src/host/sleep.ts#L63-L80) - the timer pattern"
  - "[code://packages/sdk/src/host/catalogue.ts#L894-L903](../../../../packages/sdk/src/host/catalogue.ts#L894-L903) - `allRows`"
  - "[code://packages/sdk/src/host/facts.ts#L410-L449](../../../../packages/sdk/src/host/facts.ts#L410-L449) - `refreshPullRequests`"
  - "git://github.com/microsoft/vscode@b5db36cf258 - `agentHostSessionLifecycle.ts`"
---

## Objective

An hourly pass archives each inactive session whose related pull requests are merged, and stores the time it did so.
The automatic archive removes the tree only when it is clean and pushed, and it never commits.

## Files

- `CREATE: packages/sdk/src/host/merged.ts` - `createMerged(ctx)` with `startMerged`, `stopMerged`, `mergedSoon` and the pass, on `options.timer` and `options.now` as in `sleep.ts`.
- `UPDATE: packages/sdk/src/host.ts:931` - assign `createMerged(ctx)` to the context, beside `createSleep`.
- `UPDATE: packages/sdk/src/host.ts:1048` - call `startMerged`.
- `UPDATE: packages/sdk/src/host.ts:1110` - call `stopMerged`.
- `UPDATE: packages/sdk/src/host/actions.ts:364` - after `into(rootConfig, ours)`, call `mergedSoon` when either key is in the push.
- `UPDATE: packages/sdk/src/types/sessions.ts:260-268` - the optional `autoArchivedAt?(id)` and `setAutoArchivedAt?(id, value)`, beside `remoteOrigin`.
- `UPDATE: packages/sdk/src/sessions/sessions.ts:330-390` - `Row`, `empty` and `Saved` carry `autoArchivedAt`; save, load and wrap it as host/90 task 01 does for the worktree.
- `UPDATE: packages/sdk/src/host/chatactions.ts:27-45` - an unarchive clears `autoArchivedAt`.
- `UPDATE: packages/sdk/src/types/worktrees.ts:128-143` - add the optional `pushed?(path)`: the branch has an upstream and nothing is left to push.
- `UPDATE: packages/sdk/src/repo/worktrees.ts:182-202` - `pushed` asks `git rev-parse @{u}` and `git rev-list @{u}..HEAD`.
- `UPDATE: packages/sdk/src/host/lifecycle.ts` - `shelve` from host/90, for a session with `autoArchivedAt`, skips `archiveDirtyWorktree` and removes the tree only when it is clean and `pushed` answers yes.
- `CREATE: packages/sdk/test/host-merged.test.ts` - the cases in Validation.

## Steps

1. Write the tests first, with a fake clock, a fake timer and a fake `PullRequests` port.
2. Read each key from `ctx.rootConfig` as a positive integer, else `0`.
3. Do nothing when both keys are `0`. Skip each archived session and each session with a running turn.
4. Ask the port for the session's pull requests by `forBranch` on the stored worktree branch, else the folder's branch. Task 03 adds `byUrl`.
5. Keep the related ones: drop a baseline URL unless the session took it over, compared as `facts.ts` compares URLs.
6. Archive when the related list is complete and `modifiedAt` is at or before now less the days.
7. Check the session again just before the archive.
8. Store `autoArchivedAt` as now, then archive through `sessionFlag`, so `shelve` sees the time.
9. In `shelve`, keep a dirty tree and an unpushed tree of an auto-archived session, and log why. A port with no `pushed` keeps the tree.

## Validation

- `host-merged.test.ts`: with the key at 7, the pass archives a merged session idle for 8 days and stores `autoArchivedAt`.
- `host-merged.test.ts`: the pass keeps a session with an open pull request, none merged, a running turn, or 6 idle days.
- `host-merged.test.ts`: a pull request in the baseline that the session did not take over does not count.
- `host-merged.test.ts`: `0`, `-1`, `1.5` and `'7'` turn the archive off.
- `host-merged.test.ts`: a push of the key runs a pass at once.
- `host-merged.test.ts`: an unarchive clears `autoArchivedAt`.
- `host-merged.test.ts`: an automatic archive of a clean, pushed session removes the tree and keeps the branch.
- `host-merged.test.ts`: an automatic archive keeps a clean tree with unpushed commits, and a tree with no upstream.
- `host-merged.test.ts`: under `archiveDirtyWorktree: 'commit'`, an automatic archive keeps a dirty tree and commits nothing.
- `host-merged.test.ts`: with no window push since the start, the pass archives nothing.
- `sessions.test.ts`: a file store reopened reads back `autoArchivedAt`.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

### Built

- `host/merged.ts` runs a pass at start, every hour and at each push of either key, on `options.now` and `options.timer`.
- A key counts only as a positive whole number.
- The pass does nothing when both keys are off or the host has no GitHub port.
- The pass skips an archived session, a running or restarting session, and a session that is not idle for the archive days.
- The related pull requests leave out each baseline URL that the session did not take over.
- The pass checks the row again, stores `autoArchivedAt` as an ISO time, and archives through `sessionFlag`.
- The memory store and the file store keep `autoArchivedAt`, and the file store ignores a value that is not a time.
- An unarchive clears `autoArchivedAt`.
- The `Worktrees` port has the optional `pushed`, and `gitWorktrees` asks `git rev-parse @{u}` and `git rev-list @{u}..HEAD`.
- `shelve` keeps the tree of an auto-archived session that is dirty or not pushed, and logs why.
- `shelve` also keeps that tree when the port has no `pushed`.

### Validation

- `host-merged.test.ts` has the ten task 01 cases.
- These cases use a fake clock, a fake GitHub port and real git with a bare remote.
- `sessions.test.ts` reads `autoArchivedAt` back after a file store reopen, and ignores two values that are not a time.
- The pass cases fail when the pass returns at once.
- The three kept-tree cases fail without the stricter `shelve` path.
- The unarchive case fails when the unarchive keeps the time.
- The store case fails when the file store does not write the time.

### Seen and not done

- The pass does not ask GitHub again at the archive check, so a pull request that opens during the check is not seen.
- A session that a person archives while the pass waits on GitHub keeps its manual archive, because the check sees the flag.
