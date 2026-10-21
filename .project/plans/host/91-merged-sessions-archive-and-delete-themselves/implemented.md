---
title: Merged sessions archive and delete themselves - implemented
date: 2026-10-15
refs:
  - git://3673e75a
  - "[code://packages/sdk/src/host/merged.ts](../../../../packages/sdk/src/host/merged.ts)"
  - "[code://packages/sdk/src/host/lifecycle.ts](../../../../packages/sdk/src/host/lifecycle.ts)"
  - "[code://packages/sdk/src/repo/github.ts](../../../../packages/sdk/src/repo/github.ts)"
---

The host archives an inactive session whose pull requests are merged, and later deletes a session that it archived this way.

## What was built

- [`code://packages/sdk/src/host/merged.ts`](../../../../packages/sdk/src/host/merged.ts) - the pass runs at start, every hour, and when a push carries `autoArchiveMergedSessionsAfterDays` or `autoDeleteArchivedMergedSessionsAfterDays`.
- [`code://packages/sdk/src/sessions/sessions.ts`](../../../../packages/sdk/src/sessions/sessions.ts) - both stores keep `autoArchivedAt`, and an unarchive clears it.
- [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - `shelve` keeps the tree of a session that the host archived unless the tree is clean and its branch is pushed.
- [`code://packages/sdk/src/repo/worktrees.ts`](../../../../packages/sdk/src/repo/worktrees.ts) - `pushed` compares the branch with its upstream.
- [`code://packages/sdk/src/repo/github.ts`](../../../../packages/sdk/src/repo/github.ts) - `byUrl` reads one pull request by its URL, through the API or `gh`.
- The daemon key `pullRequestLookup`, `url` or `branch`, applies with no restart. `docs/sdk/HOST.md` lists it.

## Verified

- `host-merged.test.ts` has 22 cases. `github.test.ts` and `sessions.test.ts` have 4 more.
- Each group of cases fails without its change.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- Vitest on sdk, server, agent-claude and agent-acp passes 4572 tests.

## Departures from the plan

- Under `url`, the pass asks the URLs that the session took over and the folder's URLs. After a restart, the folder's URLs are unknown until the facts are read again. Softov accepted this on 2026-10-15.
- The check before a delete reads "still idle" as no running turn and no restart. It does not read `modifiedAt` again.
- The pass logs its summary line only when it looked at a session.
- The three tasks are one commit, because `merged.ts` holds the archive and the delete together.

## Left for later

- See [deferred.md](deferred.md).
