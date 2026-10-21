---
title: install.ps1 updates the ahpd it finds
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** npm on Windows puts `ahpd.cmd` in the prefix folder itself, not in a `bin` folder.
