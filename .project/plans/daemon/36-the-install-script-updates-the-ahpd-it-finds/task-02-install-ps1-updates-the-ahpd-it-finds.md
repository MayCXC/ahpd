---
title: install.ps1 updates the ahpd it finds
status: implemented
depends: [task-01-install-sh-updates-the-ahpd-it-finds.md]
layer: scripts
refs:
  - "[code://scripts/install/install.ps1#L268-L280](../../../../scripts/install/install.ps1#L268-L280) - `Resolve-Ahpd`"
  - "[code://scripts/install/install.ps1#L287-L325](../../../../scripts/install/install.ps1#L287-L325) - `Install-Package`"
  - "[code://scripts/install/install.ps1#L424-L450](../../../../scripts/install/install.ps1#L424-L450) - the upgrade path"
  - "[code://scripts/install/test/install-ps1.test.ts](../../../../scripts/install/test/install-ps1.test.ts) - the Windows cases"
---

## Objective

`install.ps1` does on Windows what task 01 makes `install.sh` do.

## Files

- `UPDATE: scripts/install/install.ps1` - find the installed ahpd and its folder, ask, install there, check the version, add `-Yes` and `AHPD_YES`.
- `UPDATE: scripts/install/test/install-ps1.test.ts` - the cases that task 01 adds, for PowerShell.
- `UPDATE: docs/server/INSTALL.md` - name `-Yes` beside `--yes`.

## Steps

1. Do steps 1 to 13 of task 01 in `install.ps1`, with `Resolve-Ahpd` and `Confirm-Action`.
2. Get the npm prefix from the folder of the `ahpd.cmd` that `Resolve-Ahpd` finds.
3. Remove the `carrying on` branch from `Install-Package`.
4. Add the same cases to `install-ps1.test.ts`.
5. Run the install tests, and set this task and the plan row to `implemented`.

## Validation

- On a machine with `pwsh`, `pnpm vitest run scripts/install/test/install-ps1.test.ts` passes from the repository root.
- The CI job `install-windows` passes.

## Resume

- **Done so far:** `install.ps1` does what task 01 does. `Resolve-Ahpd` finds the command and its version is read. The target version comes from `-Version` or `npm view`. The folder that holds the `ahpd.cmd` is the prefix, and it has to hold `node_modules` and be writable. `-Yes` (`AHPD_YES=1`) answers the question, and a run with no console stops unless it is given. A failed npm install throws, and so does an ahpd on the PATH that still prints the old version. `Install-Package` names the folder with `--prefix` and no longer carries on after a failure. `install-ps1.test.ts` has the same cases as the shell file.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:**
  - This Linux box has no `pwsh`, so all 24 cases skip here; the syntax case skips too. The CI job `install-windows` is the one that runs them.
  - npm on Windows puts `ahpd.cmd` in the prefix folder itself, not in a `bin` folder. The prefix is the folder of the command, not its parent's parent.
