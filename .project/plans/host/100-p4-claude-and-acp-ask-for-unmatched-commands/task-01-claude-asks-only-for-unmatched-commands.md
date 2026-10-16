---
title: Claude asks only for unmatched commands
status: todo
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/asking.ts#L174-L180](../../../../packages/agent-claude/src/session/asking.ts#L174-L180) - `settled` and `canUseTool`"
---

## Objective

Claude's `canUseTool` calls `getAutoApproval` for `Bash` before it asks.

## Files

- `UPDATE: packages/agent-claude/src/session/asking.ts:174-180` - call the check after `settled` and before the question.
- `UPDATE: packages/agent-claude/test` - an allowed command runs, an unmatched one asks, a denied one asks.

## Steps

1. Read `command` from the `Bash` input in `canUseTool`.
2. Call `getAutoApproval` with the command and `bash`.
3. Allow the call and record `not-needed` when the check approves it.
4. Ask as now in every other case.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The agent-claude tests pass.
- `bypassPermissions` and `dontAsk` keep their answers.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the `sourceFirst` hook may change the input first; check the input that `canUseTool` gets.
