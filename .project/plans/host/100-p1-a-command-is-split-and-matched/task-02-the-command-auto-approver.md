---
title: The command auto approver
status: todo
depends: [task-01-a-command-line-is-split.md]
layer: sdk
refs:
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L286-L352 - `evaluate` and `_matchSubCommands`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L500-L520 - `_compileRuleEntries`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/test/node/commandAutoApprover.test.ts - the cases to port
---

## Objective

`CommandAutoApprover.evaluate` says `approved`, `denied` or `noMatch` for a line, a shell and a set of rules.
It takes `split` as an argument.

## Files

- `UPDATE: packages/sdk/src/commandautoapprover.ts` - `CommandAutoApprover`, `CommandApprovalResult` and the rule compiler.
- `UPDATE: packages/sdk/src/index.ts` - export the approver and `split` for the backends and plugins.
- `CREATE: packages/sdk/test/commandautoapprover.test.ts` - the cases ported from VS Code.

## Steps

1. Read VS Code's `evaluate`, `_matchSubCommands` and `_compileRuleEntries` at `a959ba62444`.
2. Compile each rule key as a prefix, or as a regular expression in `/.../flags` form.
3. Return `noMatch` when `split` returns `undefined` or sets `unanalyzable`.
4. Check deny rules first, then require an allow rule for every sub-command.
5. Treat a `matchCommandLine` rule as a match on the whole line.
6. Port the VS Code test cases that the splitter supports, and list the others in Resume.
7. Set this task and the plan row to `implemented`.

## Validation

- `commandautoapprover.test.ts` passes.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a deny rule means "ask" for the caller, not "refuse"; the result names stay VS Code's.
