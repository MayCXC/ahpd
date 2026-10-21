---
title: The command auto approver
status: done
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

- `UPDATE: packages/sdk/src/access/commandautoapprover.ts` - `CommandAutoApprover`, `CommandApprovalResult` and the rule compiler.
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

- **Done so far:** steps 1 to 6, 2026-10-16, extended 2026-10-18. `CommandAutoApprover`, `CommandApprovalOptions`, the rule compiler and the two matchers are in `packages/sdk/src/access/commandautoapprover.ts`, exported from `packages/sdk/src/index.ts`. `packages/sdk/test/commandautoapprover.test.ts` is new, 45 cases, all passing. `matchCommands` denies an in-place sed, as upstream's `_matchSubCommands` does.
- **Next action:** none. Softov reviewed the task and approved it 2026-10-19.
- **Open questions:** none.
- **Watch out for:** a deny rule means "ask" for the caller, not "refuse"; the result names stay VS Code's. The sed check denies before an allow rule is read, so no allow rule can lift it.
- **Ported from VS Code's test file:** the empty line, the unknown command, the forwarded rules and the `null` entry. Also the empty table, the prefix and regex keys and the endless-loop key. Also `matchCommandLine` in both directions, the transient variable and the shell state mutations. Also the compound line, the splitter as an argument and the PowerShell case-insensitivity. Also the PowerShell `(` slice and the casing of a command-line rule. Also the git sub-commands, the git writes, the git grep pager options and the case of `-C`.
- **Ported too, now that the tables are here:** the sort rules and the compress-program abbreviations, and the sed scripts that execute or write. The in-place sed forms and their exact-allow-rule case. The PowerShell cmdlets the table names, their case-insensitivity, and the refusal to match a cmdlet by its verb.
- **Ported with this reading's answer:** `Write-Host $(Get-Date)` is `noMatch` here where upstream approves it by walking the subexpression. A script block is `noMatch` where upstream denies what it finds inside. Both are the same "ask", under a different name.
- **Not ported, with why.** The `evaluate` result-shape cases, because `evaluate` returns the result string. The option sets that forward the git table alone, because the three tables are not exported; the default table carries their entries. The predicate cases (`isWriteDestApproved`), because the write check here is a folder and its edit patterns. The tree-sitter and initialization cases, because this file has no grammar. `Write-Host hi>../../outside.txt`, where upstream reads one argument and approves it; this reading sees a redirect and asks.
- **Departed from the plan:** `evaluate` returns a `CommandApprovalResult` string rather than an `{ result, autoApproveRuleResolvable }` pair. The plan names the three results and nothing else, and the second field is upstream's, for a dialog. The parse-safety rule lives in `splitCommand`, because this reading is the parser.
