---
title: A row counts the work while a turn runs
domain: host
status: active
priority: medium
created: 2026-10-23
revalidated: 2026-10-23
requires: []
refs:
  - "[code://packages/sdk/src/host/catalogue.ts#L648-L662](../../../../packages/sdk/src/host/catalogue.ts#L648-L662) - `summaryKept`, the one place a row's counts are read and kept"
  - "[code://packages/sdk/src/host/spawn.ts#L1181-L1184](../../../../packages/sdk/src/host/spawn.ts#L1181-L1184) - a finished tool call re-reads only a watched changeset"
  - "[code://packages/sdk/src/host/spawn.ts#L1383-L1399](../../../../packages/sdk/src/host/spawn.ts#L1383-L1399) - a turn's end takes the checkpoint, then calls `summaryKept`"
  - "[code://packages/sdk/src/host/spawn.ts#L1601](../../../../packages/sdk/src/host/spawn.ts#L1601) - the baseline checkpoint, then `summaryKept`"
  - "[code://packages/sdk/src/host/facts.ts#L346-L370](../../../../packages/sdk/src/host/facts.ts#L346-L370) - `refreshWatched`, a re-read coalesced to one running and one waiting, the pattern"
  - "[code://packages/sdk/src/sessions/changes.ts#L747-L767](../../../../packages/sdk/src/sessions/changes.ts#L747-L767) - `inCheckpoints` and `sessionFiles`, the session kind's counts"
  - "[code://packages/sdk/src/sessions/changes.ts#L1580-L1592](../../../../packages/sdk/src/sessions/changes.ts#L1580-L1592) - `sessionSummary` and `branchSummary`"
  - "[code://packages/sdk/src/sessions/changes.ts#L1433-L1444](../../../../packages/sdk/src/sessions/changes.ts#L1433-L1444) - the branch scope's rows, from the same fork point"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1029-L1034](../../../../packages/sdk/src/host/lifecycle.ts#L1029-L1034) - the worktree record keeps the base's name only"
  - "[code://packages/sdk/src/types/sessions.ts#L63-L68](../../../../packages/sdk/src/types/sessions.ts#L63-L68) - `StoredWorktree`"
  - "[code://packages/sdk/src/sessions/changes.ts#L905-L918](../../../../packages/sdk/src/sessions/changes.ts#L905-L918) - `mergeBaseOf` prefers `origin/<base>`, and takes a full commit as it is"
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/agentHostGitService.ts#L75-L86 - VS Code cuts a worktree from `origin/<branch>`, so its fork point is the cut
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/agentHostChangesetCoordinator.ts#L299-L306 - VS Code keeps the summary live with a file monitor
---

## Goal

A session row shows the work the session has done so far, also while a turn runs.
A build is one turn of hours, and its row now shows the counts from when the turn started.
A worktree session counts only its own work, not a commit that was on the base before the tree was cut.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "summaryKept" packages/sdk/src` - two callers: the baseline checkpoint and a turn's end.
- `rg "worktreeOf\(.*\)\?\.base" packages/sdk/src` - the base name reaches `branchSummary`, the branch scope, and the pull request words.
- On 2026-10-23, host 115's row showed no counts after four hours, with 35 files changed in its worktree.
- On 2026-10-23, host 107's row showed 6 files, +297 −18, which is exactly the unpushed plan commit `6ebe86bf`.

### Runtime path

```
tool call ends -> spawn.ts -> summaryKept -> branchSummary or sessionSummary -> kept.setChanges -> root/sessionSummaryChanged -> the row
```

### Gaps

- A row's counts are read at the baseline and at a turn's end only.
- The worktree record has the base's name and not the commit the tree was cut from.
- The fork point is `origin/<base>`, and ahpd cuts the tree from the local `<base>`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Write a plan for the two fixes | Softov, 2026-10-23: "Write the plan" | - |
| The counts move at each finished tool call, coalesced to one read running and one waiting | (defaulted: the pattern of `refreshWatched`) | 01 |
| During a turn, the session kind counts from its baseline to the working tree | (defaulted: the checkpoint at the turn's end is that same tree) | 01 |
| A worktree counts from the commit it was cut from | (defaulted: VS Code's fork point is its cut, because it cuts from `origin/<branch>`) | 02 |
| A record with no cut commit counts as it does now | (defaulted: records written before this plan) | 02 |
| The base's name stays for pull requests and `baseBranchName` | [code://packages/sdk/src/sessions/changes.ts#L1231-L1233](../../../../packages/sdk/src/sessions/changes.ts#L1231-L1233) | 02 |

## Proposed architecture

- **Data flow** - the cut commit is read once, when the tree is made, and kept on the worktree record.
- **Event flow** - a finished tool call asks `summaryKept`, and `sayMoved` drops a count that did not move.
- **State flow** - the row's counts stay in the session record, as now.
- **Layer responsibilities** - sdk host: when to read. sdk sessions: what to count.
- **Source-of-truth files** - [`code://packages/sdk/src/host/catalogue.ts`](../../../../packages/sdk/src/host/catalogue.ts), [`code://packages/sdk/src/sessions/changes.ts`](../../../../packages/sdk/src/sessions/changes.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The counts move at each tool call](task-01-the-counts-move-at-each-tool-call.md) | implemented | - |
| [02 - A worktree counts from its cut commit](task-02-a-worktree-counts-from-its-cut-commit.md) | implemented | - |

## Risks and tradeoffs

- A turn of many tool calls runs many `git diff` reads - the read is coalesced per session, as `refreshWatched` is.
- A file written outside a tool call moves the counts at the next tool call - VS Code's file monitor is not taken.

## Resume state

- **Done so far:** both tasks are built. A finished tool call asks `summaryKept`. Its reads are coalesced per session to one running and one waiting. While a turn runs, the session kind counts from its baseline to the working tree. The worktree record keeps the commit its tree was cut from. Both `branchSummary` and the branch scope diff that commit. A pull request and `baseBranchName` keep the base's name. Tests cover both kinds moving mid-turn, the coalescing, the no-op row, and a tree cut from a local `main` ahead of `origin/main`.
- **Next action:** none - the plan is built; close it when its rows are verified in a daemon.
- **Open questions:** none.
- **Watch out for:** the base's name is still the pull request's base, so do not replace it with the commit. `changesetAt` carries the cut commit under its `base` field, which only the branch scope's `state` reads.

## Final verification checklist

- [x] A running build's row moves while the turn runs.
- [x] A worktree cut from a local commit that is not pushed does not count that commit.
- [x] `plans/index.md` updated.
