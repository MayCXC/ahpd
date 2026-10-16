---
title: cofold asks for a matched tool
status: todo
depends: [task-01-the-rule-is-read-in-the-approval-check.md]
layer: agent-cofold
refs:
  - "[code://packages/agent-cofold/src/mapping.ts#L511-L580](../../../../packages/agent-cofold/src/mapping.ts#L511-L580) - `approval.requested` builds the options"
  - "[code://packages/agent-cofold/src/pauses.ts#L139-L180](../../../../packages/agent-cofold/src/pauses.ts#L139-L180) - `confirm` and `alwaysApprove`"
---

## Objective

A matched tool's question offers no `allow-session` option, and its answer never sends `alwaysApprove`.

## Files

- `UPDATE: packages/agent-cofold/src/mapping.ts:511-580` - remove the `allow-session` option for a matched tool.
- `UPDATE: packages/agent-cofold/src/pauses.ts:139-180` - never send `alwaysApprove` for a matched tool.
- `UPDATE: packages/agent-cofold/test` - a matched tool, and an unmatched one.

## Steps

1. Call the session's check for the tool in `approval.requested`.
2. Remove the `allow-session` option for a matched tool.
3. Send approve without `alwaysApprove` for a matched tool.
4. Find whether cofold can skip the question for a tool it already approved, and record it in Resume.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The agent-cofold tests pass.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** if cofold skips the question itself, the rule needs cofold's help; record it as a gap.
