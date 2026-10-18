---
title: A command line is split
status: implemented
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

- **Done so far:** steps 1 to 6, 2026-10-16, extended 2026-10-18. `splitCommand` is in `packages/sdk/src/commandautoapprover.ts`, with the result type, the separator scan, the redirect reader, the sinks and the unanalyzable marks. `packages/sdk/test/commandsplit.test.ts` is new, 18 cases, all passing. `shouldRequireConfirmationForAutoApproveParse` is ported from VS Code, and it decides whether a line with an open PowerShell group asks.
- **Next action:** the review of this task.
- **Open questions:** none.
- **Watch out for:** the splitter only needs to be right when it says yes; anything unsure is `undefined` or `unanalyzable`.
- **Departed from the plan:** readings the plan does not name, each failing closed. A `$(...)` or a backtick at the top of the line is `unanalyzable`, as one inside a quoted string is. Without that, `echo $(rm -rf /)` matched the `echo` rule and was approved. A `2` or a PowerShell `*` before a redirect is taken off the command text, because it is the shell's word and not an argument. The plan's step 3 leaves that open. A PowerShell `{...}` script block is `unanalyzable`, as a heredoc is, because the commands inside it are ones this reading does not name.
- **The PowerShell error and call shapes:** parentheses are counted, and a line that leaves a group open is `undefined`, so `if ($x -eq` asks. Upstream refuses only a PowerShell parse error; this reading refuses either shell, because it has no partial reading to offer. An assignment `$x=...` and a method call `[T]::M(...)` or `$o.M(...)` are `unanalyzable`. Each runs or changes something a rule about the cmdlet in front of it has not seen.
- **Read the same way, though step 4 omits them:** a name glued together from pieces is `unanalyzable`, and so is a glob target under PowerShell. A glob target under bash is not, because a quoted one is a name. A variable in a target stays in `writeDests`, because that name is the write check's to refuse rather than this reading's.
