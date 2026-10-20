---
title: Under open on Windows, a linked worktree's entry is named to the machine by its machine path
status: accepted
date: 2026-10-20
refs:
  - "[code://packages/computer/src/gitdir.ts](../../packages/computer/src/gitdir.ts) - `guardedMounts` and `openGitfileIn`, the file bound over the tree's `.git`"
---

## Context

A linked worktree's `.git` is a file naming its entry in the repository's git directory, and on Windows git writes it as a drive path: `gitdir: C:/Users/ana/repo/.git/worktrees/tree`.
Under `open` the host's git directory is bound in the machine at its machine path, but the tree's `.git` file still names it by the drive path, which the machine's git reads as relative to the tree: `fatal: not a git repository: /c/Users/ana/tree/C:/Users/ana/repo/.git/worktrees/tree`.
Under `fetch` this never happens, because `fetch` binds a file of its own over the tree's `.git`.
Seen on a Windows VM with Docker Desktop 29.9.1, 2026-10-20, in `computer-git-guard.test.ts`.

## Decision

Under `open` on a Windows host, when the tree's `.git` is a file, ahpd writes a file naming the same entry by its machine path into the directory it keeps its own records in, named `open-<12 hex of its content>.gitfile`, and binds it read-only over the tree's `.git`, the way `fetch` binds `computers.gitfile`.
The tree's own file is left as git wrote it.
On Linux and macOS the machine path is the host's, and nothing is bound.
Source: Softov, 2026-10-20, asked "Bug B: under `open` with a linked worktree on Windows, the tree's `.git` file names `C:/.../repo/.git/worktrees/tree`, which Linux git can't open. What should happen?": "Translated gitfile (Recommended)".

## Consequences

`open` works for a linked worktree on Windows.
The entry is checked the way `fetch` checks it before the file is written, so a `.git` naming another repository's worktree is refused under `open` on Windows too.
The file's name is never `computers.gitfile`, which is what tells a machine with a git directory of its own from the rest when its mounts are read back.

## Options

- **Refuse a machine under `open` from a linked worktree on Windows, and say to use `fetch`.** Lost: `open` stays unusable for worktrees on Windows.
