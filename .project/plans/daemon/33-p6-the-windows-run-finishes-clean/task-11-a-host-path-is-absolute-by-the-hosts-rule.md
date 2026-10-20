---
title: A host path is absolute by the host's rule
status: done
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: sdk, computer
refs:
  - "[code://packages/sdk/src/machine.ts](../../../../packages/sdk/src/machine.ts) - `seedsOf` and `resolveNeeds`, a seed's source and a mount's source"
  - "[code://packages/computer/src/manifest.ts](../../../../packages/computer/src/manifest.ts) - `absoluteOnHost`, used for a mount's source, a folder and a dev container's folder"
  - "[code://packages/computer/src/plugin.ts](../../../../packages/computer/src/plugin.ts) - `devcontainer.folders` and a `devcontainer://` source"
---

## Objective

On a Windows host, a machine need, a folder and a dev container's folder named by a Windows path are taken, and a path inside the machine is still read as POSIX.

## Files

- `UPDATE: packages/sdk/src/machine.ts` - a seed's source and a mount's source are checked with `isAbsolute`.
- `UPDATE: packages/computer/src/manifest.ts` - `absoluteOnHost`, the rule `sourceOf` already had, is exported and used for the folder and the dev container's folder.
- `UPDATE: packages/computer/src/plugin.ts` - `devcontainer.folders` and a `devcontainer://` folder use `absoluteOnHost`.
- `UPDATE: packages/sdk/test/machine-needs.test.ts`, `packages/sdk/test/agent-machine-needs.test.ts`, `packages/agent-pi/test/agent-pi.test.ts` - expected host paths are joined the system's way, and the pi case sets `USERPROFILE` beside `HOME`.

## Steps

1. Reproduce: every machine need with a host path is refused on Windows as "not an absolute host path", and a fallback mount is dropped silently.
2. Find the cause: each check tested `startsWith('/')`, which a Windows path never does.
3. Check host paths by the host's rule, and leave the state directory, a seed's target and `workdir` read as POSIX, since they are inside the machine.
4. Set `USERPROFILE` in the pi test, which read the real home of the person running it.
5. Run the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- `machine-needs.test.ts`, `agent-machine-needs.test.ts` and the agent-pi suite pass on Windows.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine: the machine-needs tests and the agent-pi suite pass.
The computer package goes from 140 failures to 123 on Windows; most of the rest follow from a host folder being mounted at the same path inside the machine, which task 12 answers.
The Linux half of Validation is the CI run of the branch.
