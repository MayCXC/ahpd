---
title: ACP asks for a matched tool
status: todo
depends: [task-01-the-rule-is-read-in-the-approval-check.md]
layer: agent-acp
refs:
  - "[code://packages/agent-acp/src/session/handlers.ts#L285-L340](../../../../packages/agent-acp/src/session/handlers.ts#L285-L340) - `askPermission` and `confirmationOptions`"
---

## Objective

For a matched tool, `askPermission` asks and offers only the agent's `allow_once` and `reject_once` options.
The host enforces the rule only on the MCP tools it serves.

## Files

- `UPDATE: packages/agent-acp/src/session/handlers.ts:285-340` - remove `allow_always` and `reject_always` for a matched tool.
- `UPDATE: packages/agent-acp/test` - a matched tool, and an unmatched one.

## Steps

1. Call the session's check in `askPermission` with the tool name.
2. Remove the `allow_always` and `reject_always` options for a matched tool.
3. Find where the host serves its MCP tools to an ACP agent.
4. Make each matched MCP tool ask the person before it runs, even when the agent did not ask.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The agent-acp tests pass.
- A matched tool shows no "always" option.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** an agent that runs its own tools without asking is out of reach; say so in task 06.
