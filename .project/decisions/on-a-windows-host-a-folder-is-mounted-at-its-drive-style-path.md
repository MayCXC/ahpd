---
title: On a Windows host, a host folder is mounted in a machine at its drive-style path
status: accepted
date: 2026-10-19
refs:
  - "[code://packages/computer/src/manifest.ts#L84](../../packages/computer/src/manifest.ts#L84) - \"A host folder to mount at the same path in the machine\""
  - "[code://packages/computer/src/manifest.ts#L1171](../../packages/computer/src/manifest.ts#L1171) - `workdir` defaults to the host folder"
  - "[code://packages/computer/src/runtime.ts#L3404](../../packages/computer/src/runtime.ts#L3404) - `docker run -v` mounts the folder at its own path"
  - "[code://packages/sdk/src/sessions/nested.ts#L655](../../packages/sdk/src/sessions/nested.ts#L655) - `outerDir`, a machine URI back to the host's"
---

## Context

The computer package mounts a host folder at the same path inside the machine, so a path is the same text on both sides and nothing translates between them.
A machine is Linux whatever the host is, and on a Windows host the folder is `C:\Users\ana\proj`: no Linux path is that text.
On Windows every machine made with a host folder is refused, at `workdir`, and most of the computer suite fails there.

## Decision

On a Windows host, a host folder is mounted in a machine at its drive-style path: `C:\Users\ana\proj` is `/c/Users/ana/proj` inside, the drive letter lowercase and the separators forward slashes.
One pair of functions turns a host path into its machine path and back, and every place a host path crosses into a machine, or a machine path comes back, goes through it.
On Linux and macOS the machine path is the host path, as now.
Source: Softov, 2026-10-19, asked "On a Windows host, where should a host folder be mounted inside a (Linux) machine, given that it can't be \"the same path\"?": "Drive-style path (Recommended)".

## Consequences

A Windows host can make a machine with a folder, and a path inside it still reads as the host path it came from.
Every crossing has to use the pair: a mount's target, `-w`, a dev container's `workspaceFolder`, the git mounts, the session's working directory handed to a nested host, an attachment put in or taken out, and a tree or a URI read back from the machine.
A crossing that is missed shows as a Windows path inside the machine, or a `/c/...` path on the host.

## Options

- **Refuse a folder machine on Windows for now.** Lost: the desk's "This computer" on Windows cannot make a machine with a folder.
- **Mount at `/workspaces/<folder name>`, as dev containers do.** Lost: two folders of one name collide, and the path inside says nothing of where the folder is.
