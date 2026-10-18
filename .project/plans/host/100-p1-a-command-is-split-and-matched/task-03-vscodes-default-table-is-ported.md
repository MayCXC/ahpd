---
title: VS Code's default table is ported
status: implemented
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

- **Done so far:** steps 1 to 4, 2026-10-16, completed 2026-10-18. `DEFAULT_TERMINAL_AUTO_APPROVE_RULES` is in `packages/sdk/src/commandautoapprover.ts`, exported from `packages/sdk/src/index.ts`, with the comment of step 2 above it: the file, the line and the commit. The git, PowerShell and sort tables are in the same file. They are spread at the lines upstream spreads them, so the key order is the same. The cases are in the `VS Code's default table` block of `packages/sdk/test/commandautoapprover.test.ts`, all passing. The git rules compile on Node 22: their `(?-i:C)` groups are written `(?:C)`, and those rules match with case only.
- **Next action:** the review of this task.
- **Open questions:** none. Each table is ported entry for entry, in order, from VS Code `a959ba62444`. `cmdDelayedExpansion.ts` is not imported by `commandAutoApprover.ts`, so nothing is ported from it.
- **Watch out for:** the git rules carry `(?-i:C)`. The compiler writes it `(?:C)` itself, so a runtime without regular expression modifiers reads the rules. Rewriting loses the insensitive reading, so `git -c` is not approved under PowerShell. The table changes upstream; the comment names the commit so a later pass can diff it.
