---
title: cofold asks only for unmatched commands
status: todo
depends: []
layer: agent-cofold
refs:
  - "[code://packages/agent-cofold/src/mapping.ts#L511-L580](../../../../packages/agent-cofold/src/mapping.ts#L511-L580) - `approval.requested`"
  - "[code://packages/agent-cofold/src/pauses.ts#L139-L180](../../../../packages/agent-cofold/src/pauses.ts#L139-L180) - `confirm`"
---

## Objective

An `approval.requested` for `shell_exec` calls `getAutoApproval` first.
An approved command is answered with approve, without `alwaysApprove`, and opens no question.

## Files

- `UPDATE: packages/agent-cofold/src/mapping.ts:511-580` - call the check before the request opens.
- `UPDATE: packages/agent-cofold/src/pauses.ts:139-180` - answer an approved command without a person.
- `UPDATE: packages/agent-cofold/test` - an allowed command, an unmatched one.

## Steps

1. Read the command from the `shell_exec` input in `approval.requested`.
2. Call `getAutoApproval` with the command and the shell.
3. Send approve without `alwaysApprove` when the check approves it, and open no request.
4. Open the request as now in every other case.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The agent-cofold tests pass.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the mapping is pure; the call to the check may belong in the session that owns `pauses.ts`.
