---
title: The Plan call is drawn from the host
status: todo
depends: []
layer: "sdk, tasks"
refs:
  - "[code://packages/agent-acp/src/mapping.ts#L399-L412](../../../../packages/agent-acp/src/mapping.ts#L399-L412) - `plan`, the Plan call drawn from ACP entries today"
  - "[code://packages/agent-acp/src/mapping.ts#L420](../../../../packages/agent-acp/src/mapping.ts#L420) - `closePlan`, which completes the call as the turn ends"
  - "[code://packages/agent-claude/src/input.ts#L307](../../../../packages/agent-claude/src/input.ts#L307) - `TodoWrite`, a row of its own in a Claude turn"
---

## Objective

A turn that changes the session's plan shows one Plan call, and its lines are the tasks of that plan in the host records.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts` - the seam through which a plugin gives the lines of the session's plan.
- `UPDATE: packages/sdk/src/host/spawn.ts` - draw the Plan call in the turn from the lines the seam gives.
- `UPDATE: packages/agent-acp/src/mapping.ts:399-412` - draw no Plan call of its own when the host draws one.
- `UPDATE: packages/agent-claude/src/session/stream.ts` - draw no `TodoWrite` row when the host draws the Plan call.
- `CREATE: packages/tasks/src/view.ts` - the lines of a plan, one per task, with its status.
- `UPDATE: packages/tasks/src/plugin.ts` - give the plan lines through the seam.
- `CREATE: packages/tasks/test/tasks-view.test.ts` - the lines of a plan.
- `CREATE: packages/agent-acp/test/agent-acp-plan.test.ts` - the Plan call in a turn, with and without the tasks plugin.

## Steps

1. Add the seam through which a plugin gives the host the lines of the session's plan.
2. Open the Plan call on the first change to the session's plan in a turn.
3. Rewrite its content with the plan lines on each later change in that turn.
4. Complete the call as the turn ends, the way `closePlan` does.
5. Write one line per task, as `- [x] <title>` for `done` and `- [ ] <title>` for the rest.
6. Keep the backend's own Plan call when no plugin gives plan lines.

## Validation

- `packages/tasks/test/tasks-view.test.ts`: a plan with three tasks gives three lines, each with its status.
- `packages/agent-acp/test/agent-acp-plan.test.ts`: with the host drawing, the turn holds one Plan call, with the host lines.
- `packages/agent-acp/test/agent-acp-plan.test.ts`: with no tasks plugin, the turn holds the bridge's own Plan call.
- `pnpm vitest run packages/tasks/test packages/agent-acp/test` passes.

## Resume
