---
title: A write redirect is checked
status: implemented
depends: [task-02-the-command-auto-approver.md]
layer: sdk
refs:
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/sessionPermissions.ts#L584-L597 - `_evaluateShellAutoApproval`
  - "[code://packages/sdk/src/vscoderootconfig.ts#L298](../../../../packages/sdk/src/vscoderootconfig.ts#L298) - `editAutoApprovePatterns` and its default"
---

## Objective

An approved command that writes through a redirect stays approved only when each target is inside the working folder and matches `editAutoApprovePatterns`.
Any other redirect turns `approved` into `noMatch`.

## Files

- `UPDATE: packages/sdk/src/commandautoapprover.ts` - the write check, with the working folder and the edit rules as arguments.
- `UPDATE: packages/sdk/test/commandautoapprover.test.ts` - a target inside and outside the folder, and one under `.git`.

## Steps

1. Read VS Code's `_evaluateShellAutoApproval` at `a959ba62444`.
2. Resolve each target in `writeDests` against the working folder.
3. Return `noMatch` for a target outside the working folder.
4. Match the target against `editAutoApprovePatterns`, with `false` entries first.
5. Return `noMatch` when a target does not match.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- `commandautoapprover.test.ts` passes.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** steps 1 to 6, 2026-10-16. `writeAllowed`, `realPathOf`, `isInside` and `patternsAllow` are in `packages/sdk/src/commandautoapprover.ts`, reached from `evaluate` through `workingDirectory` and `editPatterns`. The `a write redirect` block of `packages/sdk/test/commandautoapprover.test.ts` covers them, and all of it passes. It has a target inside the folder and one outside it, one that leaves by `..` and one under `.git`. Also one under a symbolic link out of the folder, a dynamic name, and the client's own `editAutoApprovePatterns` read from `vscoderootconfig.ts`.
- **Next action:** the review of this task.
- **Open questions:** none.
- **Watch out for:** a target with `..` or a symbolic link can leave the folder; resolve it before the check.
- **Departed from the plan:** step 4 says the `false` entries are read first. That is a departure from `_matchesEditAutoApprovePatterns`, where the last entry that matches decides. Reading them first is what makes a table of the client's own order behave. The two orders give the same answer here, because the default table allows everything before it denies. Step 2 resolves a target the store does not have yet by following the links up to the nearest folder that is there. A file that does not exist is checked against the folder it would land in. A target is `noMatch` and not left to the command rules when no folder or no patterns are given. A check that cannot be made is not one that passed.
