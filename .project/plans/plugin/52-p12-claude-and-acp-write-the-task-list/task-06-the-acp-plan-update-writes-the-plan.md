---
title: The ACP plan update writes the plan
status: todo
depends: [task-02-the-sessions-plan-takes-a-harness-list.md]
layer: "agent-acp"
refs:
  - "[code://packages/agent-acp/src/mapping.ts#L399-L412](../../../../packages/agent-acp/src/mapping.ts#L399-L412) - `plan`, the turn's one Plan call"
  - "[code://packages/agent-acp/src/mapping.ts#L524-L525](../../../../packages/agent-acp/src/mapping.ts#L524-L525) - the `plan` session update"
  - npm://@agentclientprotocol/sdk@^1.8.0 - `PlanEntry`, with `content`, `priority` and `status`
---

## Objective

Each ACP `plan` update writes the session's plan through the seam of task 01, so a `codex-acp` session fills the host list.
The Plan call in the turn stays as it is.

## Files

- `UPDATE: packages/agent-acp/src/mapping.ts:524-525` - hand the entries to the host as a whole list, beside the Plan call.
- `UPDATE: packages/agent-acp/src/session.ts` - pass the seam of task 01 to the mapping.
- `CREATE: packages/agent-acp/test/agent-acp-plan.test.ts` - a plan update through a fake ACP server.

## Steps

1. Hand each `plan` update's entries to the host as a whole list, with the tool `plan`.
2. Give each entry its `content`, `status` and `priority`.
3. Hand an update with no entries as an empty list.
4. Keep the Plan call that `plan` draws today.

## Validation

- `packages/agent-acp/test/agent-acp-plan.test.ts`: a plan update hands the whole list with each status and priority.
- `packages/agent-acp/test/agent-acp-plan.test.ts`: a second update in the next turn hands a list for the same session.
- `packages/agent-acp/test/agent-acp-plan.test.ts`: the turn still holds one Plan call.
- `pnpm vitest run packages/agent-acp/test` passes.

## Resume
