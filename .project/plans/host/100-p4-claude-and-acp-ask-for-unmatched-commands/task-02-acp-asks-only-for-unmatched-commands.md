---
title: ACP asks only for unmatched commands
status: todo
depends: []
layer: agent-acp
refs:
  - "[code://packages/agent-acp/src/session/handlers.ts#L285-L340](../../../../packages/agent-acp/src/session/handlers.ts#L285-L340) - `askPermission`"
---

## Objective

`askPermission` calls `getAutoApproval` for a call of kind `execute`.
An approved command gets the agent's `allow_once` option without a question.

## Files

- `UPDATE: packages/agent-acp/src/session/handlers.ts:285-340` - call the check before the question.
- `UPDATE: packages/agent-acp/test` - an allowed command, an unmatched one and a call with no command line.

## Steps

1. Read the command line from the request's tool call, if the agent sent one.
2. Ask as now when there is no command line.
3. Call `getAutoApproval` with the command and the shell.
4. Select the agent's `allow_once` option when the check approves it.
5. Ask as now when the agent offers no `allow_once` option.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The agent-acp tests pass.
- The host never selects an "always" option for a person.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** each ACP agent puts the command in a different place; record the agents you checked.
