---
title: A Windows folder has a path in the machine - implemented
date: 2026-10-20
refs:
  - git://ca28a8cd
  - git://35e48b0a
  - https://github.com/softov/ahpd/pull/38 - tasks 01 to 06
  - https://github.com/softov/ahpd/pull/43 - tasks 07 and 08 and the real-Docker test fixes, green and merged on 2026-10-20
  - "[code://packages/sdk/src/machine.ts#L115-L130](../../../../packages/sdk/src/machine.ts#L115-L130) - `machinePathOf` and `hostPathOf`, the pair"
  - "[code://packages/computer/src/gitdir.ts](../../../../packages/computer/src/gitdir.ts) - the git mounts at machine paths, and the worktree's `.git` file for `open`"
---

A Windows ahpd makes a machine with a host folder, as a Linux one does.
The folder is mounted at its drive-style path, `/c/work/demo` for `C:\work\demo`, a session inside works there, and what comes back from the machine names the host's paths.
A Windows folder's tracked files are clean in the machine, and a machine under `open` on a linked worktree runs git in it.
On Linux and macOS the pair is the path itself, so nothing changes there.

## What was built

- [`code://packages/sdk/src/machine.ts`](../../../../packages/sdk/src/machine.ts) - `machinePathOf` turns a host path into its machine path, and `hostPathOf` turns it back; nothing else turns one into the other.
- [`code://packages/computer/src/manifest.ts`](../../../../packages/computer/src/manifest.ts) and [`code://packages/computer/src/runtime.ts`](../../../../packages/computer/src/runtime.ts) - every mount, `-w` and dev container override names the folder by its machine path, and the host side of a mount keeps the host path.
- The same files - a host path matched against what a machine reports is matched in the host's spelling.
- [`code://packages/computer/src/hostpath.ts`](../../../../packages/computer/src/hostpath.ts) - `sourceOnHost` reads both forms Docker Desktop gives a bind's `Source`: `C:\...` and `/run/desktop/mnt/host/c/...`.
- [`code://packages/sdk/src/nested.ts`](../../../../packages/sdk/src/nested.ts) - a nested host is told its working directory by its machine path, and every file URI under the folder it sends back names the host's path.
- [`code://packages/computer/src/runtime.ts`](../../../../packages/computer/src/runtime.ts) - `putIn` and `takeOut` write and remove an attachment at its machine path.
- [`code://packages/agent-acp/src/session/opening.ts`](../../../../packages/agent-acp/src/session/opening.ts) - an ACP agent in a machine is sent the machine path as `cwd` in `session/new`, `session/load`, `session/resume` and `session/fork`; the catalogue keeps the host path.
- [`code://packages/agent-acp/src/mapping.ts`](../../../../packages/agent-acp/src/mapping.ts) and [`code://packages/agent-acp/src/session/handlers.ts`](../../../../packages/agent-acp/src/session/handlers.ts) - a diff path or an `fs/` path an agent names is read through `hostPathOf`.
- Claude needed no change: its spawn hands the host folder to the port's `how`, and `within` turns it into the machine path.
- [`code://packages/computer/src/gitdir.ts`](../../../../packages/computer/src/gitdir.ts) - a machine's own git directory is seeded with the host's `core.filemode` and `core.autocrlf`, a machine under `open` is given them as `GIT_CONFIG_*` in its environment, and under `open` on Windows a file naming a linked worktree's entry by its machine path is bound read-only over the tree's `.git`.
- The computer tests build the paths of commands inside a machine with `machinePathOf`, and pass a `user` only where `process.getuid` exists.

## Verified

- On Softov's Windows machine, 2026-10-19: the computer suite passed 397 with 53 skipped, each skip POSIX by nature with its reason; the full unit suite, `pnpm -s typecheck` and `pnpm -s boundary` passed.
- On a Windows 10 VM with Docker Desktop 29.9.1, 2026-10-20: the 38 real-Docker cases of the three `computer-git-` files pass; before tasks 07 and 08, 17 of 37 failed.
- The same VM, by hand, with `ahpc` 0.9.0 and the scripted ACP agent in a disposable `node:22` machine on `C:\work\demo`: the machine works at `/c/work/demo`, the files the agent and a command in the machine wrote are on Windows, `git status` in the machine names only them, and the session's changes list both. The results are in [`.project/pending/windows-machine-paths-checks.md`](../../../pending/windows-machine-paths-checks.md).
- PR #43's CI run passed every job, `check-windows` with 5780 cases, and Softov merged it on 2026-10-20 and chose to close the plan.

## Departures from the plan

- Tasks 07 and 08 were added after task 06's run with the real Docker Desktop found them, by Softov's answer of 2026-10-20.
- Docker Desktop's two spellings of a bind's `Source` were found on the VM; `sourceOnHost` reads both.

## Left for later

- A turn in which an ACP agent opens a terminal fails in the hand check, because the terminal runs on the host; that is [acp/19](../../acp/19-a-terminal-in-a-machine-runs-in-the-machine/plan.md), and the hand check's terminal turn is run again when it is built.
- The rest is in [deferred.md](deferred.md).
