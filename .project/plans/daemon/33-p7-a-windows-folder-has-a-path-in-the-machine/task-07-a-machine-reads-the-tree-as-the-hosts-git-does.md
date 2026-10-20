---
title: A machine reads the tree as the host's git does
status: done
depends: [task-06-the-computer-suite-runs-on-a-windows-machine.md]
layer: computer
refs:
  - "[code://packages/computer/src/gitdir.ts](../../../../packages/computer/src/gitdir.ts) - `GitSeed`, `seedOf` and `openReadingOf`"
  - "[code://packages/computer/src/runtime.ts](../../../../packages/computer/src/runtime.ts) - `seedGit`, and the variables of `run` and `overrideOf`"
---

## Objective

A Windows folder's tracked files are clean in a machine as they are on the host: a machine's own git directory is seeded with the host's `core.filemode` and `core.autocrlf`, and a machine under `open` is given them in its environment.

## Files

- `UPDATE: packages/computer/src/gitdir.ts` - `GitSeed` gains `filemode` and `autocrlf`, which `seedOf` reads from the tree's effective config; `openReadingOf(root)` answers them as `GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_<n>` and `GIT_CONFIG_VALUE_<n>`.
- `UPDATE: packages/computer/src/runtime.ts` - `seedGit` writes both into the machine's config after `user.email` and before the index is made; `run` and `overrideOf` lay `openReadingOf` over the machine's variables under `open`.

## Steps

1. Read `core.filemode` and `core.autocrlf` in `seedOf`, decision `a-machine-reads-the-tree-as-the-hosts-git-does`.
2. Write them in `seedGit`, before `reset`.
3. Give them to a machine under `open` through `openReadingOf`, in `run` and in the dev container override, decision `an-open-machine-is-given-the-hosts-reading-in-its-environment`.

## Validation

- On a Windows VM with Docker Desktop 29.9.1: `computer-git-fetch.test.ts`, whose six status cases failed with `M src/tracked.txt`, passes.
- The hand check: a disposable machine on `C:\work\demo`, whose `README.md` git checked out as CRLF (`i/lf w/crlf`) and Docker Desktop shows as `0777`, answers an empty `git status` before the turn.
- `pnpm typecheck` and `pnpm boundary` pass; the computer suite passes on Windows.
- The Linux jobs pass.

## Resume

Done 2026-10-20 on the Windows VM. Not reviewed.
Before: in a disposable machine, `git status` answered ` M README.md`, with `old mode 100644`, `new mode 100755`, and the CRLF line changed.
After: it answers nothing until the agent writes, then only the new files.
A probe on the VM showed `GIT_CONFIG_*` with both values makes the `open` case clean too; no case covers the `open` variables on a real Docker yet.
