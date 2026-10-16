---
title: The docs say what a row counts
status: todo
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
