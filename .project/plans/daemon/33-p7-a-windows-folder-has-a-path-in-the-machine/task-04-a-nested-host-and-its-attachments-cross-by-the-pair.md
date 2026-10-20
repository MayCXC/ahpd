---
title: A nested host and its attachments cross by the pair
status: done
depends: [task-01-a-host-path-has-a-machine-path.md]
layer: sdk, computer
refs:
  - "[code://packages/sdk/src/nested.ts#L371](../../../../packages/sdk/src/nested.ts#L371) - `fileUri`"
  - "[code://packages/sdk/src/nested.ts#L424-L425](../../../../packages/sdk/src/nested.ts#L424-L425) - the host URI sent inside when the port names none"
  - "[code://packages/sdk/src/nested.ts#L655-L660](../../../../packages/sdk/src/nested.ts#L655-L660) - `outerDir`"
  - "[code://packages/sdk/src/host/machines.ts#L207-L230](../../../../packages/sdk/src/host/machines.ts#L207-L230) - `putIn` and `takeOut` callers"
  - "[code://packages/computer/src/runtime.ts#L3559-L3573](../../../../packages/computer/src/runtime.ts#L3559-L3573) - `putIn` and `takeOut`"
  - "[code://packages/computer/src/plugin.ts#L1518](../../../../packages/computer/src/plugin.ts#L1518) - the nested host's working directory"
---

## Objective

A nested host in a machine is told its working directory by its machine path, the URIs it sends back name the host's paths, and an attachment lands at its machine path.

## Files

- `UPDATE: packages/sdk/src/nested.ts` - the fallback inside URI is the machine path's; `outerDir` maps every file URI the nested host sends back, not only `workingDirectories`.
- `UPDATE: packages/computer/src/runtime.ts` - `putIn` and `takeOut` write and remove at `machinePathOf(path)`.
- `UPDATE: packages/computer/src/plugin.ts:1518` - the nested host's `workingDirectory` comes through `within`, which task 03 makes a machine path.

## Steps

1. Build the fallback inside URI at `nested.ts:424` from `machinePathOf` of the host path, with `posixUriOf`.
2. List every file URI a nested host sends back (file edits, attachments, tool paths, `workingDirectories`), and map each through `outerDir` with `hostPathOf`.
3. Write and remove attachments at `machinePathOf(path)` in `putIn` and `takeOut`.
4. Assert both sides in `nested-start.test.ts` and `nested-proxy.test.ts` with a Windows folder.
5. Run the sdk and computer tests and the typecheck.
6. Set this task and the plan row to `implemented`.

## Validation

- On Windows the nested host works in `/c/...`, and its URIs reach the client as `file:///C:/...`.
- On Linux nothing changes.

## Resume

Done 2026-10-19. Not reviewed.

The inner host is told the folder's machine path when the port names none, and `outward` maps every file URI under the folder inside back to the host's, not only `workingDirectories`.
`putIn` and `takeOut` write and remove at `machinePathOf(path)`.
Finding: a nested session forwards no attachments at all - `begin` takes none - so there was nothing to map inward.
On Softov's Windows machine, in the runner-like setup: the computer suite passes 397 with 53 skipped, the full unit suite passes, and `pnpm -s typecheck` and `pnpm -s boundary` pass.
The Linux half of Validation is the CI run of the branch; on Linux and macOS the pair is the path itself.
