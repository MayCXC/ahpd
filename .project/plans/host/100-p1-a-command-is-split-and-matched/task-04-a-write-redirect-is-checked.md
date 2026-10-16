---
title: A write redirect is checked
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a target with `..` or a symbolic link can leave the folder; resolve it before the check.
