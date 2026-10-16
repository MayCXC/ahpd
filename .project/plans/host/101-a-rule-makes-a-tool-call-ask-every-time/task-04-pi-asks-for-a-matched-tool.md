---
title: pi asks for a matched tool
status: todo
depends: [task-01-the-rule-is-read-in-the-approval-check.md]
layer: agent-pi
refs:
  - "[code://packages/agent-pi/src/session.ts#L385-L438](../../../../packages/agent-pi/src/session.ts#L385-L438) - `decide`"
  - "[code://packages/agent-pi/src/session.ts#L445](../../../../packages/agent-pi/src/session.ts#L445) - `askBefore`"
---

## Objective

pi's `decide` returns an ask for a matched tool before it reads the permission mode.

## Files

- `UPDATE: packages/agent-pi/src/session.ts:385-438` - check the rule first in `decide`.
- `UPDATE: packages/agent-pi/test` - a matched tool in each mode.

## Steps

1. Call the session's check at the top of `decide`.
2. Return an ask with no "always" option for a matched tool, in every mode.
3. Write the tests.
4. Set this task and the plan row to `implemented`.

## Validation

- The agent-pi tests pass.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** nothing yet.
