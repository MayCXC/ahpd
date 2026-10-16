---
title: VS Code's default table is ported
status: todo
depends: [task-02-the-command-auto-approver.md]
layer: sdk
refs:
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L590 - `DEFAULT_TERMINAL_AUTO_APPROVE_RULES`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L483-L489 - `_compileRules` falls back to it
---

## Objective

The sdk exports VS Code's default rules as `DEFAULT_TERMINAL_AUTO_APPROVE_RULES`.
p2 uses it when no client pushed rules and the daemon setting says so.

## Files

- `UPDATE: packages/sdk/src/commandautoapprover.ts` - the table, with a comment that cites its VS Code source and commit.
- `UPDATE: packages/sdk/test/commandautoapprover.test.ts` - a command from the table is approved, and a denied one asks.

## Steps

1. Copy the table from VS Code at `a959ba62444`, entry by entry.
2. Cite the source file, the line and the commit in a comment above the table.
3. Export the table.
4. Write the tests.
5. Set this task and the plan row to `implemented`.

## Validation

- `commandautoapprover.test.ts` passes.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the table changes upstream; the comment names the commit so a later pass can diff it.
