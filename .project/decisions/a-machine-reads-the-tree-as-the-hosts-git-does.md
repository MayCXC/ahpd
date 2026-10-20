---
title: A machine's own git directory reads the tree as the host's git does
status: accepted
date: 2026-10-20
refs:
  - "[code://packages/computer/src/gitdir.ts](../../packages/computer/src/gitdir.ts) - `seedOf`, what the host's tree says, now with `core.filemode` and `core.autocrlf`"
  - "[code://packages/computer/src/runtime.ts](../../packages/computer/src/runtime.ts) - `seedGit`, which writes them into the machine's git directory before the index is made"
---

## Context

Under `fetch`, the default guard, and under `copy`, a machine commits in a git directory of its own, which `seedGit` makes from the host's tree.
It carried two config values, `user.name` and `user.email`, and nothing else of the host's config.
On a Windows host with Docker Desktop that leaves every tracked file changed in the machine, before the agent has touched anything:

- Docker Desktop shows a Windows folder's files as `-rwxrwxrwx`, and the machine's git, with `core.filemode=true`, reads the bit: `old mode 100644`, `new mode 100755`.
- Git for Windows says `core.autocrlf=true` in its system config, so a file it checked out is CRLF on disk and LF in the commit (`i/lf w/crlf`), and the machine's git, without it, sees the whole file changed.

An agent committing there would commit those changes, and the fetch would bring them back.
Seen on a Windows VM with Docker Desktop 29.9.1, 2026-10-20, in `computer-git-fetch.test.ts` and in a disposable machine made by hand.

## Decision

When a machine's own git directory is seeded, the host's effective `core.filemode` and `core.autocrlf` for the tree are written into its config, beside `user.name` and `user.email`, before the index is made.
A value the host's git does not set is not written.
Source: Softov, 2026-10-20, asked "Bug A: under the default `fetch` guard on Windows, every tracked file shows as changed in the machine (filemode 0777 from Docker Desktop, CRLF from autocrlf). How should the machine get the host's `core.filemode` and `core.autocrlf`?": "Seed config (Recommended)".

## Consequences

The same files are clean on both sides, and `git config` in the machine shows why.
On Linux and macOS the values are usually the machine's own defaults, so nothing changes there.
A machine made before this keeps its old config until it is made again.
A machine under `open` has no git directory of its own to write into; [an open machine is given the host's reading in its environment](an-open-machine-is-given-the-hosts-reading-in-its-environment.md).

## Options

- **The machine's environment.** Every machine is made with `GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_<n>` and `GIT_CONFIG_VALUE_<n>` carrying the two values, for every guard in one place. Lost: an agent or tool that sets its own `GIT_CONFIG_COUNT` replaces them, and they sit in the container's record.
