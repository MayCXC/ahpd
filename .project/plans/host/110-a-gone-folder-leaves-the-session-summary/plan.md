---
title: A gone folder leaves the session summary
domain: host
status: planned
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
requires: []
refs:
  - "[code://packages/sdk/src/host/catalogue.ts#L478-L490](../../../../packages/sdk/src/host/catalogue.ts#L478-L490) - `summaryOf`, the live session's summary and snapshot, with `lead.workingDirectories()`"
  - "[code://packages/sdk/src/host/catalogue.ts#L948-L971](../../../../packages/sdk/src/host/catalogue.ts#L948-L971) - `adopt`, the catalogue row with `row.workingDirectories`"
  - "[code://packages/sdk/src/fileuri.ts#L65](../../../../packages/sdk/src/fileuri.ts#L65) - `localPath`, a `file:` URI to a path on this host"
  - "[code://packages/sdk/src/resources.ts#L141-L145](../../../../packages/sdk/src/resources.ts#L141-L145) - `No directory at`, the refusal a client gets for a gone folder"
  - "[code://docs/sdk/SESSIONS.md#L63](../../../../docs/sdk/SESSIONS.md#L63) - what `workingDirectories` are"
  - "[code://packages/sdk/src/host/lifecycle.ts#L990-L1025](../../../../packages/sdk/src/host/lifecycle.ts#L990-L1025) - where a session's worktree is made"
---

## Goal

A session keeps its row after the folder it ran in is removed outside ahpd, for example a git worktree removed by hand.
The session's summary then names no folder that is not there.
A client that draws its folder list from session summaries then shows no gone folder, with no change in the client.
When the folder comes back, the summary names it again.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "existsSync|statSync" packages/sdk/src/host/catalogue.ts packages/sdk/src/host/history.ts` - nothing checks that a session's folder exists.
- In ahpw, `rootsOf` in `src/resources/folders/roots.ts` adds `session.workingDirectories?.[0]` for every session, and checks nothing.
- In the protocol, `SessionSummary.workingDirectories` is optional.

### Runtime path

```
worktree removed outside ahpd -> session kept -> listing or summaryOf -> workingDirectories still names the folder -> ahpw folder list shows it -> resourceList refuses "No directory at"
```

### Gaps

- A summary names a folder whatever the disk says.
- The host removes a worktree only when it disposes or archives the session, so a removal by hand is never seen.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The host stops naming a gone folder in the session summary, rather than each client hiding it | Softov, 2026-10-19, chose "ahpd plan" for "Where should the fix go?" | 01 |
| The folder is left out of the summary, and the session's record keeps it | (defaulted: a folder that comes back is named again, and nothing is lost) | 01 |
| Only a `file:` folder on this host is checked; any other URI is kept as it is | (defaulted: the host cannot read another machine's disk) | 01 |

## Proposed architecture

- **Data flow** - `summaryOf` and `adopt` pass `workingDirectories` through one filter. The filter keeps a URI that is not `file:`, and a `file:` URI whose path is a directory on this host.
- **Event flow** - Unchanged. A client sees the change at the next listing or summary.
- **State flow** - The store record and `wheres` keep the folder. Only what goes out in a summary changes.
- **Layer responsibilities** - sdk: the filter and its two callers · docs: one sentence in `SESSIONS.md`.
- **Source-of-truth files** - [`code://packages/sdk/src/host/catalogue.ts`](../../../../packages/sdk/src/host/catalogue.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the summary names only folders that are there](task-01-the-summary-names-only-folders-that-are-there.md) | todo | - |

## Risks and tradeoffs

- A session whose only folder is gone has a summary with no folder. A client groups it with no folder, which is true.
- The check reads the disk once per folder per summary. A listing of many sessions reads many folders; the check is one `stat` each.
- A folder on a network mount that does not answer could slow a listing.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-summary-names-only-folders-that-are-there.md](task-01-the-summary-names-only-folders-that-are-there.md).
- **Open questions:** none.
- **Watch out for:** `summaryOf` also builds the live snapshot, so the snapshot and the row stay the same. A session inside a computer can name a folder that is not on this host. Read how plugin 11 names it before the filter touches it.

## Final verification checklist

- [ ] A session whose worktree is removed by hand stays listed, and its summary names no folder.
- [ ] The folder is named again after it is made again.
- [ ] A URI that is not `file:` is kept.
- [ ] The gates pass.
- [ ] `plans/index.md` updated.
