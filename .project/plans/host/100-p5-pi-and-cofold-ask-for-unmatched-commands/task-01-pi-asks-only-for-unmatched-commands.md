---
title: pi asks only for unmatched commands
status: done
depends: []
layer: agent-pi
refs:
  - "[code://packages/agent-pi/src/session.ts#L385-L438](../../../../packages/agent-pi/src/session.ts#L385-L438) - `decide`"
---

## Objective

pi's `decide` calls `getAutoApproval` for `bash` and `powershell` when it would ask.

## Files

- `UPDATE: packages/agent-pi/src/session.ts:385-438` - call the check in the branches that ask.
- `UPDATE: packages/agent-pi/test` - an allowed command, an unmatched one, and each shell.

## Steps

1. Find each branch of `decide` that returns an ask for `bash` or `powershell`.
2. Call `getAutoApproval` there with the command and the shell.
3. Allow the call when the check approves it.
4. Write the tests.
5. Set this task and the plan row to `implemented`.

## Validation

- The agent-pi tests pass.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** `decide` is async and its per-mode switch moved into `byMode`, so the mode's answer is known before the check is consulted. Only an `ask` reaches the new `allowedByRule`, which reads `input.command`, names the shell from the tool (`bash` or `powershell`) and calls `start.getAutoApproval('shell', command, shell)`. `not-needed` turns the ask into a run; every other answer leaves the ask as it was. Tests: `packages/agent-pi/test/agent-pi-autoapproval.test.ts`, eight cases. They cover an allowed bash command and an allowed PowerShell command, with the check seeing `shell: 'powershell'`. They also cover an unmatched command, no check at all and a non-shell tool. The last cases cover `dontAsk`, `bypassPermissions` and an input with no command line.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** `powershell` uses the PowerShell rules of the splitter, not the bash ones. The check narrows questions and adds none. `dontAsk`, `plan` and `bypassPermissions` keep their answers and the check is not asked. A tool whose input names no string `command` still asks.
