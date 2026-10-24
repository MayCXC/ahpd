---
title: A worktree made after the daemon starts offers no changeset until a file edit
status: open
date: 2026-10-24
severity: major
refs:
  - "[code://packages/sdk/src/sessions/changes.ts#L1368-L1378](../../packages/sdk/src/sessions/changes.ts#L1368-L1378) - `scopes` offers `Uncommitted Changes` only for a directory in `held`"
  - "[code://packages/sdk/src/sessions/changes.ts#L1898-L1907](../../packages/sdk/src/sessions/changes.ts#L1898-L1907) - `refresh` is the only writer of `held`"
  - "[code://packages/sdk/src/host.ts#L1179-L1184](../../packages/sdk/src/host.ts#L1179-L1184) - the start runs `refresh` for each directory served then"
  - "[code://packages/sdk/src/host/facts.ts#L327-L336](../../packages/sdk/src/host/facts.ts#L327-L336) - `watchedIn` re-reads a directory only when a client watches one of its changesets"
  - "[code://packages/sdk/src/host/facts.ts#L555-L570](../../packages/sdk/src/host/facts.ts#L555-L570) - a file edit runs `refresh` and sends `session/changesetsChanged`"
---

## Symptom

On 2026-10-24 the host 107 build session ran in a new worktree and edited no file, but its tests wrote `packages/sdk/test/fixtures/wire.jsonl`.
The session row in ahpw showed `+61 -62` in one file.
The Changes tab showed "Esta sessão não registra alterações", with no `Uncommitted Changes` scope.
The plugin 62 session, in a worktree made at the same time, edited files, and its tab showed `Uncommitted Changes`.

## Cause

Not confirmed by a test. The code shows this path.
`scopes` offers the git scopes only for a directory that `refresh` has read.
The daemon start reads each directory it serves, and a file edit reads the directory of the edit.
A watch re-reads a directory only when a client already watches one of its changesets, and a session with no changeset has none to watch.
So a worktree made after the start, where the session only runs commands, is never read.

## Impact

A person cannot see or review the changes of a session that works only through shell commands.
The row counts and the Changes tab disagree.

## Workaround

Make a file edit in the session, or restart the daemon.

## Fix

- Run `refresh` for the directory when the host makes a worktree or opens a session in a new directory.
- Run `refresh` for the session's directory at the end of each turn.
- Related: [a-sessions-changes-are-kept-under-two-keys.md](a-sessions-changes-are-kept-under-two-keys.md), where a file a shell command wrote is missing from the `session` scope.
