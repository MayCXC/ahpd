---
title: Git and changes
status: current
covers:
  - packages/sdk/src/sessions/changes.ts
  - packages/sdk/src/types/changes.ts
  - packages/sdk/src/host/facts.ts
  - packages/sdk/src/repo/worktrees.ts
  - packages/computer/src/gitdir.ts
decisions:
  - decisions/a-commit-asks-first-and-names-what-it-takes.md
  - decisions/an-ahp-edit-uri-carries-its-session-as-base64url.md
  - decisions/a-machine-commits-in-its-own-repository-and-the-host-fetches-it.md
refs:
  - "[code://packages/sdk/src/types/changes.ts#L302-L310](../../packages/sdk/src/types/changes.ts#L302-L310) - `ChangesetWatch` and its `ready` promise"
  - "[code://packages/sdk/src/host/facts.ts#L385-L394](../../packages/sdk/src/host/facts.ts#L385-L394) - the read again when a watch is armed"
  - "[code://packages/sdk/src/sessions/changes.ts#L162-L172](../../packages/sdk/src/sessions/changes.ts#L162-L172) - `ahp-git://head/<path>`, the side before a change"
  - "[code://packages/sdk/src/sessions/changes.ts#L421-L443](../../packages/sdk/src/sessions/changes.ts#L421-L443) - `capturedUri` and `pendingUri`, with the session in base64url"
  - "[code://packages/sdk/src/sessions/changes.ts#L1240-L1262](../../packages/sdk/src/sessions/changes.ts#L1240-L1262) - `read`, which parses the URI that a client sends back"
  - "[code://packages/sdk/src/sessions/changes.ts#L226-L256](../../packages/sdk/src/sessions/changes.ts#L226-L256) - `COMMIT` and `commitConfirmation`"
  - "[code://packages/sdk/src/sessions/changes.ts#L1300-L1323](../../packages/sdk/src/sessions/changes.ts#L1300-L1323) - the operations for each changeset scope"
  - "[code://packages/sdk/src/sessions/changes.ts#L1385-L1410](../../packages/sdk/src/sessions/changes.ts#L1385-L1410) - the commit: one file, the index, or everything"
  - "[code://packages/sdk/src/sessions/changes.ts#L900-L1023](../../packages/sdk/src/sessions/changes.ts#L900-L1023) - `pullRequest`, prepare and create"
  - "[code://packages/sdk/src/host/facts.ts#L93-L131](../../packages/sdk/src/host/facts.ts#L93-L131) - `captureBaseline` and `promotePullRequest`"
  - "[code://packages/sdk/src/host/facts.ts#L53-L66](../../packages/sdk/src/host/facts.ts#L53-L66) - the baseline in the session's `_meta.github`"
  - "[code://packages/sdk/src/repo/worktrees.ts#L55-L72](../../packages/sdk/src/repo/worktrees.ts#L55-L72) - `worktreesOf` and `worktreeFor`"
  - "[code://packages/server/src/commands/options.ts#L436-L440](../../packages/server/src/commands/options.ts#L436-L440) - the daemon's `worktreesRoot` key"
  - "[code://packages/computer/src/gitdir.ts#L313-L370](../../packages/computer/src/gitdir.ts#L313-L370) - `gitMounts`, the git layout of a machine"
  - "[code://packages/computer/src/plugin.ts#L303-L304](../../packages/computer/src/plugin.ts#L303-L304) - `gitGuard`, with `bind` read as `fetch`"
  - git://d9d4f950^ - the deleted decisions this spec was written from: a-changeset-watch-says-when-it-is-armed, a-commit-takes-the-index-when-anything-is-staged, a-machines-git-directory-is-read-only-but-what-a-commit-writes, changes-uris-are-parsed-on-read-and-minted-to-survive-a-client, session-pull-request-baseline-is-sent, worktrees-can-live-under-one-root
---

The changeset source in [`code://packages/sdk/src/sessions/changes.ts`](../../packages/sdk/src/sessions/changes.ts) shows a session's git changes as AHP changesets and runs the operations on them.
The scopes are the uncommitted tree, the whole session and each turn.
Each side of a diff has a URI that this host makes and reads back.
The committed side is an `ahp-git:` URI, and a side that the host holds is an `ahp-edit:` URI.
The operations are the ones of the VS Code agent host: commit, discard, stage, unstage, revert, checkout, and the two pull request operations.
The session's pull request facts go to clients in `_meta.github`.

## Scenarios

### A watch says when it is armed

WHEN a changeset source starts to watch a folder
THEN the watch it gives back can have a `ready` promise
AND the host reads the folder again when `ready` resolves, if the watch is still the current one.
The reason: a change made before the watchers are armed reaches no watcher.

### A diff side has a URI that survives a client

WHEN the host makes the URI of a side
THEN the committed side is `ahp-git://head/<path>`
AND a side from a turn is `ahp-edit://turn/<session>/<turn>/<phase>/<path>`
AND a proposed side is `ahp-edit://pending/<session>/<call>/<path>`
AND the session is one base64url segment, and each other segment is percent-encoded.
The reason: VS Code sends a URI back in its own form.
That form drops an empty authority, lowercases an authority and splits a `%2F` in a segment.

### A client sends a URI back

WHEN a client reads a side by its URI
THEN the host parses the URI and decodes its path
AND it finds the held side by the parsed parts, not by the text it made
AND an `ahp-git:` URI with an empty authority resolves the same as one with `head`.

### The commit asks first

WHEN the uncommitted tree has changes
THEN the `commit` operation has a confirmation that names the subject line
AND it says that the commit takes the staged files, or all files with the untracked count when nothing is staged.
The subject is the session title, or "Changes from an agent session".

### What a commit takes

WHEN a person commits one file
THEN the host adds that file when it is on disk and runs `git commit --only` on it.
WHEN a person commits the changeset
AND the index has changes
THEN the host commits the index as it is.
WHEN the index has no changes
THEN the host runs `git add -A` and commits everything, untracked files included.
The answer is "Committed <sha>: <subject>".

### Stage and unstage

WHEN the uncommitted tree has changes
THEN the changeset offers stage and unstage next to commit and discard
AND each file says in `_meta` with `ahpd.staged` and `ahpd.unstaged` whether it has staged or unstaged changes.

### A pull request is opened

WHEN the repository is on GitHub, the branch has no pull request and the tree has changes
THEN the uncommitted and session changesets offer `create-pr` and `prepare-pull-request`.
WHEN `create-pr` runs on the base branch with changes
THEN the host makes a branch `agent/<slug>` from the subject, commits everything, and pushes
AND it gives back the open pull request of the branch, or opens a new one.
WHEN the repository or branches changed since the form was prepared
THEN the operation fails and asks to open the form again.

### The session's pull request baseline

WHEN GitHub first answers for a session's folder, or a session opens on facts the host already has
THEN the host keeps the pull requests of the branch as the session's `initialPullRequestUrls`, once
AND an empty list is a kept baseline
AND the session's `_meta.github` sends `initialPullRequestUrls` and `associatedPullRequestUrls`.
The baseline is saved with the session, so it stays after a restart.

### A pull request becomes the session's

WHEN `create-pr` gives a pull request
THEN its URL goes to the front of `associatedPullRequestUrls`
AND it leaves `initialPullRequestUrls`, compared without case and without a trailing slash.
See [Host tools](host-tools.md) for the artifact that it records.

### Where worktrees live

WHEN the host makes a worktree for a session
AND `worktreesRoot` is not set
THEN the worktree is in `<repo>.worktrees` next to the repository, the same folder that VS Code uses.
WHEN `worktreesRoot` is set
THEN the worktree is in `<root>/<repo name>/<name>`
AND a relative root in the config file resolves from the folder of that file.
The name is the branch without `agents/`, with each `/` changed to `-`.

### A machine commits in a git folder of its own

WHEN a session with a repository runs on a computer with `gitGuard` `fetch`, the default
THEN no part of the host's git folder is writable in the machine
AND the machine commits in a git folder in its own volume, which reads the host's objects through read-only alternates
AND the host fetches the work back as a bundle, with object checks on.
WHEN a profile says `gitGuard` `bind`
THEN the host reads it as `fetch`.
The reason: a writable bind of the host's git folder lets a machine put a link where the host's own git later writes.
See [Computers](computers.md).
