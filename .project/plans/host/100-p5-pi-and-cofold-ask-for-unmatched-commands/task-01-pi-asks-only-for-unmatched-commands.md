---
title: pi asks only for unmatched commands
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** `powershell` uses the PowerShell rules of the splitter, not the bash ones.
