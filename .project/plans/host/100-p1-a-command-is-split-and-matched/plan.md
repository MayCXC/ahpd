---
title: A command is split and matched
domain: host
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/host/100-terminal-commands-approved-by-rule/plan.md
changes: []
creates: []
decisions: []
refs:
  - "[code://packages/sdk/src/vscoderootconfig.ts#L326-L331](../../../../packages/sdk/src/vscoderootconfig.ts#L326-L331) - the declared shape of `terminalAutoApproveRules`"
  - "[code://packages/sdk/src/vscoderootconfig.ts#L298](../../../../packages/sdk/src/vscoderootconfig.ts#L298) - `editAutoApprovePatterns`, the edit rules a redirect is checked against"
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L19-L31 - `SAFE_POSIX_REDIRECT_TARGETS`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L130-L171 - `CommandApprovalResult` and `IShouldAutoApproveOptions`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L286-L352 - `evaluate` and `_matchSubCommands`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L500-L520 - `_compileRuleEntries`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L590 - `DEFAULT_TERMINAL_AUTO_APPROVE_RULES`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/sessionPermissions.ts#L584-L597 - `_evaluateShellAutoApproval`: write redirects against the edit rules
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/test/node/commandAutoApprover.test.ts - the cases to port
---

## Goal

The sdk splits a command line into sub-commands and write targets, and matches them against the terminal rules.
It says `approved`, `denied` or `noMatch`, as VS Code's `evaluate` does.
It holds VS Code's default table, and it checks a write redirect against `editAutoApprovePatterns`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -n "tree-sitter\|shell-quote\|splitCommand" packages/` - no parser in ahpd.
- In VS Code, `commandAutoApprover.ts` and its test file.

### Runtime path

```
split(line, shell) -> { subCommands, writeDests, unanalyzable } | undefined -> CommandAutoApprover.evaluate(rules, edit rules, cwd) -> approved / denied / noMatch
```

### Gaps

- `Not found: a shell splitter - searched "split\|tokenize" in packages/sdk/src`.
- `Not found: the default table in ahpd - searched "DEFAULT_TERMINAL" in packages/`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `split(line, shell)` returns `{ subCommands, writeDests, unanalyzable }` or `undefined`; `undefined` means ask | Softov, 2026-10-16, chose "a small splitter in the sdk" for "Which parser splits the command line" | 01 |
| The splitter is the sdk's own and fails closed | Softov, 2026-10-16, chose "a small splitter in the sdk" for "Which parser splits the command line" | 01 |
| VS Code's default table is ported, with a ref to its source | Softov, 2026-10-16, chose "Setting, default VS Code's table" for "What applies when no client pushed rules" | 03 |
| A redirect into the working folder that matches `editAutoApprovePatterns` is allowed; any other redirect asks | Softov, 2026-10-16, chose "as VS Code" for "How a write redirect is checked" | 04 |
| The approver takes `split` as an argument, so p3 can replace it | (defaulted: the seam p3 needs) | 02 |
| `unanalyzable: true` gives `noMatch`, as `undefined` does | (defaulted: as VS Code, fail closed) | 02 |

## Proposed architecture

- **Data flow** - `evaluate` calls `split`, then checks deny rules, then requires an allow rule for every sub-command, then checks each write target.
- **Layer responsibilities** - The sdk holds all of it, in `packages/sdk/src/commandautoapprover.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A command line is split](task-01-a-command-line-is-split.md) | todo | - |
| [02 - The command auto approver](task-02-the-command-auto-approver.md) | todo | 01 |
| [03 - VS Code's default table is ported](task-03-vscodes-default-table-is-ported.md) | todo | 02 |
| [04 - A write redirect is checked](task-04-a-write-redirect-is-checked.md) | todo | 02 |

## Risks and tradeoffs

- A splitter that is wrong can approve a command. It fails closed, and the VS Code cases test it.

## Resume state

- **Done so far:** planned 2026-10-16 from the answers in the parent plan.
- **Next action:** [task-01-a-command-line-is-split.md](task-01-a-command-line-is-split.md).
- **Open questions:** none.
- **Watch out for:** the approver is pure: it gets the rules, the edit rules and the working folder as arguments, and reads no config.

## Final verification checklist

- [ ] The ported VS Code cases pass.
- [ ] `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.
- [ ] `plans/index.md` updated.
