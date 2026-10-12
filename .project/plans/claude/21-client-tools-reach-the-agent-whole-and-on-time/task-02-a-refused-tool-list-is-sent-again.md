---
title: A tool list the SDK refused is sent again
status: todo
depends: []
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/clienttools.ts#L425-L446](../../../../packages/agent-claude/src/session/clienttools.ts#L425-L446) - `setTools`"
---

## Objective

`setTools` keeps a new tool list only once `setMcpServers` has taken it.
A list that the SDK refused counts as a change when it comes again, so it is sent again.

## Files

- `UPDATE: packages/agent-claude/src/session/clienttools.ts:425-446` - build the next declaration on the side, and keep it after the SDK answers.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - the cases below, beside the Claude client tool tests.

## Steps

1. Build the next `ahp` server entry in a copy of `ctx.declared`, and leave `ctx.declared` as it is.
2. Call `setMcpServers` with the copy.
3. Set `ctx.offering` and `ctx.declared` from the copy after the call resolves.
4. Return false on a rejection, and leave `ctx.offering` and `ctx.declared` as they were.

## Validation

- `setMcpServers` rejects once, and the same list sent again calls it a second time.
- A list that the SDK took, sent again, does not call it.
- `pnpm exec vitest run packages/sdk packages/agent-claude` passes.

## Resume
