---
title: A machine under open is given the host's reading of the tree in its environment
status: accepted
date: 2026-10-20
refs:
  - "[code://packages/computer/src/gitdir.ts](../../packages/computer/src/gitdir.ts) - `openReadingOf`, the two values as `GIT_CONFIG_*` variables"
  - "[code://packages/computer/src/runtime.ts](../../packages/computer/src/runtime.ts) - `run` and `overrideOf`, which give them to a machine under `open`"
---

## Context

Under `open` a machine uses the host's own git directory, so it reads the host repository's config, and none of the host's global or system config.
Git for Windows writes `core.filemode=false` into every repository, so that one arrives; it says `core.autocrlf=true` in its system config, so that one does not, and every file it checked out with CRLF is changed in the machine.
[A machine's own git directory reads the tree as the host's git does](a-machine-reads-the-tree-as-the-hosts-git-does.md) covers `fetch` and `copy`, where the machine has a config of its own to write into.

## Decision

A machine under `open` is made with the host's effective `core.filemode` and `core.autocrlf` for the tree as `GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_<n>` and `GIT_CONFIG_VALUE_<n>` in its environment, so every git in it reads them; a value the host's git does not set is left out.
Nothing is written into the host's repository.
Source: Softov, 2026-10-20, asked "Under `open` the machine uses the host's repo config. `core.filemode=false` is already there (Git for Windows writes it at init), but `core.autocrlf=true` lives in Git for Windows' system config, which the machine can't see. How should `open` get autocrlf?": "Environment, open only (Recommended)".

## Consequences

A Windows tree under `open` is clean in the machine as it is on the host.
A command in the machine that sets its own `GIT_CONFIG_COUNT` replaces the two values for that command.
The variables are in the container's record, which holds nothing secret here.

## Options

- **Write `core.autocrlf` into the host repository's `.git/config`.** Lost: it changes the person's repository on disk.
- **Leave `open` as it is, and say so in the docs.** Lost: every CRLF checkout would show as changed in the machine.
