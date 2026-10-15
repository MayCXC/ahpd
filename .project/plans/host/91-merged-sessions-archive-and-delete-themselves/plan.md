---
title: Merged sessions archive and delete themselves
domain: host
status: built
priority: medium
created: 2026-10-14
revalidated: 2026-10-14
requires:
  - plans/host/90-an-archived-session-gives-back-its-worktree/plan.md
refs:
  - "[code://packages/sdk/src/vscoderootconfig.ts#L253-L266](../../../../packages/sdk/src/vscoderootconfig.ts#L253-L266) - the two keys, declared with default `0` and read by nothing"
  - "[code://packages/sdk/src/host/actions.ts#L263-L392](../../../../packages/sdk/src/host/actions.ts#L263-L392) - `root/configChanged`, which writes `rootConfig` at L364"
  - "[code://packages/sdk/src/host/changesets.ts#L347-L348](../../../../packages/sdk/src/host/changesets.ts#L347-L348) - how a module reads a root key from `ctx.rootConfig`"
  - "[code://packages/sdk/src/host/sleep.ts#L63-L80](../../../../packages/sdk/src/host/sleep.ts#L63-L80) - `createSleep`, the timer, `now` and `arm` pattern to mirror"
  - "[code://packages/sdk/src/host/sleep.ts#L206-L223](../../../../packages/sdk/src/host/sleep.ts#L206-L223) - `rearm`, `startSleep` and `stopSleep`, started and stopped in `host.ts` L1048 and L1110"
  - "[code://packages/sdk/src/host/catalogue.ts#L894-L903](../../../../packages/sdk/src/host/catalogue.ts#L894-L903) - `allRows`, every session with its status and `modifiedAt`"
  - "[code://packages/sdk/src/host/facts.ts#L410-L449](../../../../packages/sdk/src/host/facts.ts#L410-L449) - `refreshPullRequests`, how the host asks the GitHub port for a branch"
  - "[code://packages/sdk/src/host/facts.ts#L95-L105](../../../../packages/sdk/src/host/facts.ts#L95-L105) - `captureBaseline`, the pull requests a branch had before the session"
  - "[code://packages/sdk/src/types/github.ts#L5-L50](../../../../packages/sdk/src/types/github.ts#L5-L50) - `PullRequest` and the `PullRequests` port, which asks by branch only"
  - "[code://packages/sdk/src/host/lifecycle.ts#L465-L476](../../../../packages/sdk/src/host/lifecycle.ts#L465-L476) - `mayDispose`, which lets the host itself delete"
  - "[code://packages/sdk/src/host/lifecycle.ts#L498-L560](../../../../packages/sdk/src/host/lifecycle.ts#L498-L560) - `removeSession`"
  - "[code://packages/sdk/src/host/chatactions.ts#L27-L45](../../../../packages/sdk/src/host/chatactions.ts#L27-L45) - `sessionFlag`, the archive"
  - "[code://packages/sdk/src/repo/github.ts#L38-L131](../../../../packages/sdk/src/repo/github.ts#L38-L131) - the GitHub port by API and by `gh`, the place for `byUrl`"
  - "[code://packages/sdk/src/types/worktrees.ts#L128-L143](../../../../packages/sdk/src/types/worktrees.ts#L128-L143) - `dirty` and `remove`; the port cannot say whether a branch is pushed"
  - "[code://packages/server/src/rootconfig.ts#L32-L40](../../../../packages/server/src/rootconfig.ts#L32-L40) - `DAEMON_KEYS` and `LIVE`"
  - "git://github.com/microsoft/vscode@b5db36cf258 - `agentHostSessionLifecycle.ts`, the hourly pass, its candidates and its checks"
---

## Goal

A session whose pull request is merged is archived after `autoArchiveMergedSessionsAfterDays` days without activity.
A session archived that way is deleted `autoDeleteArchivedMergedSessionsAfterDays` days later.
A value of `0` turns each action off, which is the default.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -i "autoArchive|autoDelete" packages/*/src` - the two declarations in `vscoderootconfig.ts`, and nothing reads them.
- `rg "forBranch\(" packages/sdk/src` - `facts.ts` and `changes.ts` ask the port by branch. No path asks by URL.
- `rg "setInterval|arm\(" packages/sdk/src/host` - `sleep.ts` and `wakes.ts` keep their own timers through `options.timer`.

### Runtime path

```
window root/configChanged { autoArchiveMergedSessionsAfterDays: 7 } -> actions.ts -> rootConfig -> (nothing reads it)
```

### Gaps

- No pass looks at sessions for age or pull request state.
- The store has no field for the time of an automatic archive, so a manual archive and an automatic one look the same.
- `rootConfig` lives in memory. After a restart it is empty until a window pushes its settings.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A pass runs once at start, then every hour, and again when either key changes | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 01 |
| A value that is not a positive integer counts as `0`, and `0` turns the action off | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 01 |
| A candidate is not running a turn and has related pull requests: the branch's, less the baseline's that the session did not take over | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 01 |
| The related pull requests are complete when none is open and at least one is merged | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 01 |
| An unarchived candidate whose `modifiedAt` is older than the archive days is archived, and the time is stored | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 01 |
| Unarchive clears the stored time | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 01 |
| Only a session with a stored time older than the delete days is deleted | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 02 |
| A session whose tree still exists is not deleted | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 02 |
| An automatic archive removes the tree only when it is clean, its branch has an upstream, and nothing is left to push | Softov, 2026-10-14, chose "Upstream: only pushed and clean" for "Which tree does an automatic archive remove?" | 01 |
| The automatic path never commits: it ignores `archiveDirtyWorktree` from host/90, and a dirty or unpushed tree stays | Softov, 2026-10-14, chose "Upstream: only pushed and clean" for "Which tree does an automatic archive remove?" | 01 |
| `shelve` from host/90 knows an archive is automatic by the stored `autoArchivedAt`, so the pass stores the time before the archive | Softov, 2026-10-14, chose "Upstream: only pushed and clean" for "Which tree does an automatic archive remove?" (defaulted: proposed) | 01 |
| The daemon key `pullRequestLookup` picks how the pass learns the pull request state: `url` asks `byUrl` for each related URL, `branch` asks `forBranch` for the session's branch | Softov, 2026-10-14, chose "Both, by a setting" for "How does the pass learn the state of a pull request?" | 03 |
| `url` is the default | Softov, 2026-10-14, chose "Both, by a setting" for "How does the pass learn the state of a pull request?" (defaulted: upstream b5db36cf258) | 03 |
| `byUrl` is optional on the port; under `url`, a port without it is asked by branch, and the log says so once | Softov, 2026-10-14, chose "Both, by a setting" for "How does the pass learn the state of a pull request?" (defaulted: proposed) | 03 |
| A push of `pullRequestLookup` applies at once, as a push of `closedChats` does | Softov, 2026-10-14, chose "Both, by a setting" for "How does the pass learn the state of a pull request?" (defaulted: proposed, mirrors `closedChats`) | 03 |
| The two lifecycle keys do not outlive a restart, as every other root key; the pass waits for a window to push them | Softov, 2026-10-14, "Do the two keys outlive a restart?" (defaulted: proposed) | 01 |
| Each candidate is checked again just before the archive or the delete | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream b5db36cf258) | 01, 02 |

## Proposed architecture

- **Data flow** - the pass reads `allRows`, asks GitHub for each candidate by `pullRequestLookup`, and acts through `sessionFlag` or `removeSession`.
- **Event flow** - an archive goes out as `session/isArchivedChanged`, so every client sees it. A delete goes out as `root/sessionRemoved`.
- **State flow** - the store keeps `autoArchivedAt` per session. The two keys stay in `rootConfig`.
- **Layer responsibilities** - The sdk holds a new `host/merged.ts` with the pass and its timer, the store field and the trigger in `actions.ts`. It also holds `byUrl` on the GitHub port, `pushed` on the `Worktrees` port and the stricter rule in `shelve`. The server holds the `pullRequestLookup` key.
- **Source-of-truth files** - `packages/sdk/src/host/merged.ts` (new), [`code://packages/sdk/src/sessions.ts`](../../../../packages/sdk/src/sessions.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An inactive merged session is archived](task-01-an-inactive-merged-session-is-archived.md) | done | host/90 |
| [02 - An auto-archived merged session is deleted](task-02-an-auto-archived-merged-session-is-deleted.md) | done | 01 |
| [03 - A daemon key picks how a pull request is looked up](task-03-a-daemon-key-picks-how-a-pull-request-is-looked-up.md) | done | 01 |

## Risks and tradeoffs

- A delete cannot be undone. Only a session the pass itself archived is deleted, and each check runs again just before the delete.
- The pass asks GitHub once per candidate each hour. A host with many old sessions makes many calls, so the pass asks only for sessions with a baseline or a recorded pull request.
- A host with no window connected since its start has no settings, so the pass does nothing.
- An automatic archive of a session whose branch is not pushed keeps the tree. Task 02 then never deletes that session, because its tree exists.
- Under `url`, the pass asks GitHub once per related URL. A session with many pull requests makes more calls than under `branch`.

## Resume state

- **Done so far:** built 2026-10-15, see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a session archived by hand has no stored time. It must never become a delete candidate.

## Final verification checklist

- [x] A test: a merged, inactive session is archived and gets a stored time.
- [x] A test: an automatic archive keeps a dirty tree under `commit`, and keeps a clean tree whose branch is not pushed.
- [x] A test: `pullRequestLookup` at `url` and at `branch` each find a merged pull request.
- [x] A test: an open pull request, a running turn or a recent `modifiedAt` keeps the session.
- [x] A test: an auto-archived session is deleted after the delete days.
- [x] A test: a session archived by hand is never deleted.
- [x] A test: `0`, a negative number and a fraction turn each action off.
- [x] The gates pass: typecheck, boundary, schema and vitest.
- [x] `docs/sdk/HOST.md` lists `pullRequestLookup`.
- [x] `plans/index.md` updated.
