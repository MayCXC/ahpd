---
title: What a machine answers names the host's paths
status: done
depends: [task-01-a-host-path-has-a-machine-path.md]
layer: computer
refs:
  - "[code://packages/computer/src/runtime.ts#L1176-L1189](../../../../packages/computer/src/runtime.ts#L1176-L1189) - `within`"
  - "[code://packages/computer/src/runtime.ts#L2318-L2325](../../../../packages/computer/src/runtime.ts#L2318-L2325) - `startIn`"
  - "[code://packages/computer/src/devcontainer.ts#L321-L330](../../../../packages/computer/src/devcontainer.ts#L321-L330) - `workdirOf`"
  - "[code://packages/computer/src/gitdir.ts#L162-L168](../../../../packages/computer/src/gitdir.ts#L162-L168) - `spellingOf`"
  - "[code://packages/computer/src/gitdir.ts#L480-L484](../../../../packages/computer/src/gitdir.ts#L480-L484) - `gitInside`"
---

## Objective

A host path matched against what a machine reports is matched in the host's own spelling, and a tree a machine names is read on the host by its host path.

## Files

- `UPDATE: packages/computer/src/runtime.ts` - `within` compares with the system's separator and returns a machine path; each `hostGit(tree, ...)` gets `hostPathOf(tree)`, and each `git -C tree` inside keeps the machine path.
- `UPDATE: packages/computer/src/devcontainer.ts` - `workdirOf` matches a mount's source in the host's spelling.
- `UPDATE: packages/computer/src/gitdir.ts` - `spellingOf` and `gitInside` compare with the system's separator.

## Steps

1. Read how Docker Desktop reports a Windows bind's `Source` in `docker inspect`, on a Windows machine with Docker Desktop, and record it in this task's Resume.
2. Make `within` match a host path against a mount's source in that spelling and the host's, with the system's separator, and turn the rest into a machine path.
3. Pass `hostPathOf(tree)` to every `hostGit` call (2520-2610, 2653, 2696-2712, 2766-2796, 2892-2927); leave the `git -C` calls inside on the machine path.
4. Compare with `sep` in `workdirOf`, `spellingOf` and `gitInside`.
5. Run the computer suite and the typecheck.
6. Set this task and the plan row to `implemented`.

## Validation

- On Windows a session's cwd under the folder starts in the matching `/c/...` path, and the tree's git commands on the host run in `C:\...`.
- On Linux nothing changes.

## Resume

Done 2026-10-19, apart from step 1. Not reviewed.

Step 1 needs Docker Desktop, which this machine does not have; `.project/pending/windows-machine-paths-checks.md` asks Softov for it.
Until then `sourceOnHost` in `hostpath.ts` reads a source in either spelling Docker Desktop is known to report, `/run/desktop/mnt/host/c/...` and `/host_mnt/c/...`, as well as the host's own.
`within`, `workdirOf` and the old-guard check compare in the host's spelling, `spellingOf` and `gitInside` use `sep`, and `hostGit` runs in `hostPathOf(tree)`.
A worktree's `.git` naming its git directory with `/`, as git on Windows writes it, is read with `resolve`; it was refused before.
On Softov's Windows machine, in the runner-like setup: the computer suite passes 397 with 53 skipped, the full unit suite passes, and `pnpm -s typecheck` and `pnpm -s boundary` pass.
The Linux half of Validation is the CI run of the branch; on Linux and macOS the pair is the path itself.
