---
title: A command is split and matched - implemented
date: 2026-10-19
refs:
  - git://15138d6a
  - "[code://packages/sdk/src/access/commandautoapprover.ts](../../../../packages/sdk/src/access/commandautoapprover.ts)"
  - "[code://packages/sdk/src/index.ts](../../../../packages/sdk/src/index.ts)"
---

The sdk now splits a shell command line into sub-commands and write targets, and matches them against terminal rules.
The answer is `approved`, `denied` or `noMatch`, as VS Code's `evaluate` gives.
The sdk holds VS Code's default table, and it checks a write redirect against `editAutoApprovePatterns`.
A line that the splitter cannot read with certainty gives `noMatch`, so the call asks.

## What was built

- [`code://packages/sdk/src/access/commandautoapprover.ts`](../../../../packages/sdk/src/access/commandautoapprover.ts) - `splitCommand`, `CommandAutoApprover`, `DEFAULT_TERMINAL_AUTO_APPROVE_RULES` with the git, PowerShell and sort tables, the sed check, the parse-safety check and the write check.
- [`code://packages/sdk/src/index.ts`](../../../../packages/sdk/src/index.ts) - exports all of it.

## Verified

- `packages/sdk/test/commandsplit.test.ts`: 18 cases.
- `packages/sdk/test/commandautoapprover.test.ts`: 45 cases, in the blocks `the rules a line is answered by`, `VS Code's default table`, `a PowerShell line` and `a write redirect`.
- The cases are ported from VS Code's `commandAutoApprover.test.ts` at `a959ba62444`, and task 02's Resume lists the cases not ported with the reason.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` passed.
- Softov reviewed the plan on 2026-10-19 and approved the close.

## Departures from the plan

- Task 01 - a `$(...)` or a backtick at the top of a line is `unanalyzable`.
  A PowerShell script block, an assignment and a method call are `unanalyzable` too.
- Task 01 - a line that leaves a parenthesis open is `undefined` under either shell, where VS Code refuses only a PowerShell parse error.
- Task 02 - `evaluate` returns the result string, not VS Code's pair with `autoApproveRuleResolvable`.
- Task 03 - the git rules write `(?-i:C)` as `(?:C)`, so they compile on Node 22 and match with case only.
- Task 04 - the `false` entries of the edit patterns are read first, where VS Code lets the last match decide.
- Task 04 - a target is `noMatch` when no folder or no edit patterns are given.

## Left for later

- Nothing.
