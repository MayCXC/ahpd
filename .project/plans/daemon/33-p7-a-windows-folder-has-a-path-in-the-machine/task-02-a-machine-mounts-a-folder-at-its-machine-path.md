---
title: A machine mounts a folder at its machine path
status: implemented
depends: [task-01-a-host-path-has-a-machine-path.md]
layer: computer
refs:
  - "[code://packages/computer/src/manifest.ts#L1133-L1173](../../../../packages/computer/src/manifest.ts#L1133-L1173) - `mountedAt`, the folder mount and the `workdir` default"
  - "[code://packages/computer/src/runtime.ts#L3404-L3451](../../../../packages/computer/src/runtime.ts#L3404-L3451) - `docker run -v` and `-w`"
  - "[code://packages/computer/src/runtime.ts#L1353-L1393](../../../../packages/computer/src/runtime.ts#L1353-L1393) - the dev container override"
  - "[code://packages/computer/src/runtime.ts#L2104-L2111](../../../../packages/computer/src/runtime.ts#L2104-L2111) - `seedGit`"
  - "[code://packages/computer/src/gitdir.ts#L313-L351](../../../../packages/computer/src/gitdir.ts#L313-L351) - `gitMounts`"
  - "[code://packages/computer/src/gitdir.ts#L540-L545](../../../../packages/computer/src/gitdir.ts#L540-L545) - a bind's default target"
---

## Objective

Every mount and working directory a machine is made with names the folder by its machine path, and the host side of a mount keeps the host path.

## Files

- `UPDATE: packages/computer/src/manifest.ts` - the folder mount's target and the `workdir` default are `machinePathOf(...)`; the source stays the host path.
- `UPDATE: packages/computer/src/runtime.ts` - the `-v` target, `-w`, the dev container's `workspaceFolder` and `workspaceMount` target, and `seedGit`'s `--work-tree` are machine paths; `seedOf(root)`, which runs on the host, keeps the host path.
- `UPDATE: packages/computer/src/gitdir.ts` - each git mount's target, and a bind's default target, are machine paths.

## Steps

1. In `manifest.ts`, mount the folder as `${mountedAt}:${machinePathOf(mountedAt)}` with that target, and default `workdir` to `machinePathOf(folder)`.
2. In `runtime.ts`, apply `machinePathOf` to each target at lines 3404-3411, to `-w` at 3451, to the override at 1353-1393, and to `--work-tree` at 2104-2111.
3. In `gitdir.ts`, apply it to `gitMounts`' targets and to `bind.target ?? bind.path` at 540-545.
4. Assert in the computer tests that a Windows folder is mounted at `/c/...` and a Linux folder at its own path, with the platform passed where the code takes one.
5. Run the computer suite and the typecheck.
6. Set this task and the plan row to `implemented`.

## Validation

- On Windows a machine's mounts, `-w` and dev container override name `/c/...` targets and `C:\...` sources.
- On Linux nothing in a machine's arguments changes.

## Resume

Done 2026-10-19. Not reviewed.

The folder's mount, `-w`, the dev container's workspace mount and folder, the git mounts' targets and `seedGit`'s `--work-tree` are machine paths; every source stays the host path, and `seedOf` reads the host's tree.
The computer tests expect each target as `machinePathOf(...)`, and a fixture standing for a machine Docker already holds names machine paths too.
On Softov's Windows machine, in the runner-like setup: the computer suite passes 397 with 53 skipped, the full unit suite passes, and `pnpm -s typecheck` and `pnpm -s boundary` pass.
The Linux half of Validation is the CI run of the branch; on Linux and macOS the pair is the path itself.
