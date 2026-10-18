---
title: The docs say what a row counts
status: implemented
depends:
  - task-04-a-rows-changes-are-the-sessions-summary.md
layer: docs
refs:
  - "[code://docs/sdk/SESSIONS.md#L48](../../../../docs/sdk/SESSIONS.md#L48) - `The state a session reports`"
  - "[code://docs/sdk/SESSIONS.md#L94](../../../../docs/sdk/SESSIONS.md#L94) - `Isolation and worktrees`"
---

## Objective

docs/sdk/SESSIONS.md says that a row's `changes` are Branch Changes for a worktree session and Session Changes otherwise.
It names the checkpoint refs and when they go.

## Files

- `UPDATE: docs/sdk/SESSIONS.md` - a paragraph in `The state a session reports`, and one line in `Isolation and worktrees`.

## Steps

1. Say what each kind counts, and that a commit does not take the counts to zero.
2. Name `refs/agents/<sid>/checkpoints/turn/<N>`, and say that the refs go with the session.
3. Set this task and the plan row to `implemented`.

## Validation

- The page names both kinds, the refs and the fallback for a folder with no git.

## Resume

- **Done so far:** built 2026-10-16. `docs/sdk/SESSIONS.md`'s `The state a session reports` has a paragraph on a row's `changes`: Branch Changes for a worktree session as against everything else since its base, Session Changes for a folder session as the difference between the tree it started from and the tree its last turn ended with - so a commit in the folder does not take its counts to zero - read when a turn ends and kept per session, with a session this host has not read for reporting its directory's uncommitted changes, and a folder with no git falling back to the files the session's own tools were seen to write, as the reference host's `auto` strategy does. `Isolation and worktrees` names `refs/agents/<sid>/checkpoints/turn/<N>`, `turn/0` as the tree the session started from, that nothing is checked out from them and no branch moves, and that they are removed with the session on `disposeSession`.
- **Next action:** none - task 06 is the plan's last task. The plan is built; nothing is set to `done`.
- **Open questions:** none of the task's own.
- **Watch out for:** the paragraph's last sentence, on the fallback for a folder with no git, describes the source's rule (`sessionFiles` is the checkpoints where they answer and the edit tracker where they do not). A row reaches that tracker through the store the id names, and the tracker is keyed by the channel URI, which is the fault noted in task 04's Resume - so for a live row in a non-git folder the page is ahead of what the daemon does today. `packages/sdk/test/fixtures/wire.jsonl` is dirty from the suite; restore it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
