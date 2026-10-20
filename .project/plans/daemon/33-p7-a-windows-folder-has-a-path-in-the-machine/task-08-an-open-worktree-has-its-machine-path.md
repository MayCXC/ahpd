---
title: An open machine on a linked worktree reaches its entry on Windows
status: done
depends: [task-06-the-computer-suite-runs-on-a-windows-machine.md]
layer: computer
refs:
  - "[code://packages/computer/src/gitdir.ts](../../../../packages/computer/src/gitdir.ts) - `guardedMounts`, `openGitfileIn` and `OPEN_GITFILE`"
  - "[code://packages/computer/test/computer-git-guard.test.ts](../../../../packages/computer/test/computer-git-guard.test.ts) - the mounts under `open`, and the real-Docker commit"
---

## Objective

Under `open` on a Windows host, a machine on a linked worktree runs git in it: a file naming the worktree's entry by its machine path is bound over the tree's `.git`, read-only.

## Files

- `UPDATE: packages/computer/src/gitdir.ts` - `guardedMounts` under `open`, on Windows, where the tree's `.git` is a file: the entry checked by `entryOf`, `openGitfileIn(state, entry)` writes `gitdir: <machine path of the entry>` into `open-<12 hex>.gitfile`, and the bind lands at the machine path of the tree's `.git`.
- `UPDATE: packages/computer/test/computer-git-guard.test.ts` - the `open` mounts name the file on Windows; a Windows-only case reads it.
- `UPDATE: packages/computer/test/computer-disposable.test.ts` - the disposable `open` case expects the bind on Windows.

## Steps

1. Bind the file under `open` on Windows, decision `an-open-worktree-on-windows-is-given-its-machine-path`.
2. Name it so the mounts read back never take it for `computers.gitfile`.
3. Expect it in the `open` cases, on Windows only.

## Validation

- On a Windows VM with Docker Desktop 29.9.1: "commits into the host's git directory from a machine its profile leaves open", which failed with exit 128, passes.
- On Windows: the computer suite passes, with the new case; elsewhere it skips.
- The Linux jobs pass.

## Resume

Done 2026-10-20 on the Windows VM. Not reviewed.
Before: `fatal: not a git repository: /c/.../tree/C:/.../repo/.git/worktrees/tree`.
