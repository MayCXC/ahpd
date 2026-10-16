---
title: A command line is split
status: todo
depends: []
layer: sdk
refs:
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L19-L31 - the safe redirect sinks
---

## Objective

`split(line, shell)` splits a bash or PowerShell line into sub-commands and write targets.
It returns `undefined` for any line it cannot read.

## Files

- `CREATE: packages/sdk/src/commandautoapprover.ts` - `split` and its result type.
- `CREATE: packages/sdk/test/commandsplit.test.ts` - the splitter cases.

## Steps

1. Define the result type `{ subCommands, writeDests, unanalyzable }`.
2. Split on `&&`, `||`, `;`, `|` and new lines, outside quotes.
3. Record each redirect target in `writeDests`, and drop the safe sinks.
4. Set `unanalyzable` for `$(...)`, backticks, process substitution and here-documents.
5. Return `undefined` for an unclosed quote or an unknown shell.
6. Write the tests for bash and PowerShell.
7. Set this task and the plan row to `implemented`.

## Validation

- `commandsplit.test.ts` passes.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the splitter only needs to be right when it says yes; anything unsure is `undefined` or `unanalyzable`.
