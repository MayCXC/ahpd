---
title: A call to a client that left ends at once
status: todo
depends: []
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/clienttools.ts#L235-L335](../../../../packages/agent-claude/src/session/clienttools.ts#L235-L335) - the joins: `unclaimed`, `expecting`, `asked`, `withdraw` and `refuseAll`"
  - "[code://packages/agent-claude/src/session/clienttools.ts#L337-L346](../../../../packages/agent-claude/src/session/clienttools.ts#L337-L346) - `openCall`, which returns early for a tool that is no longer on offer"
  - "[code://packages/agent-claude/src/session/clienttools.ts#L395-L415](../../../../packages/agent-claude/src/session/clienttools.ts#L395-L415) - `ranByClient`, which waits in `untilOpen` or `claim`"
  - "[code://packages/sdk/src/tools/clientcalls.ts#L298-L312](../../../../packages/sdk/src/tools/clientcalls.ts#L298-L312) - `gone`, which ends only the calls already open"
---

## Objective

A handler that waits for a call to a client that has left gets a refusal at once.
It does not wait until the turn is stopped.

## Files

- `UPDATE: packages/agent-claude/src/session/clienttools.ts:337-346` - refuse the waiting handler when the frame names a tool that is no longer on offer.
- `UPDATE: packages/agent-claude/src/session/clienttools.ts:425-460` - add `clientGone`, which ends the joins for the client's tools and then calls the holder's `clientGone`.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - the cases below, beside the Claude client tool tests.

## Steps

1. Add a function that refuses every join for one tool name, as `withdraw` does for one id.
2. In `openCall`, call that function for the tool name and the id when `clientToolOf` finds no tool.
3. Add `clientGone` to `methods`, after the spread of `calls.methods`.
4. In `clientGone`, refuse the joins of each tool whose name starts with `mcp__ahp__<clientId>__`.
5. Call the holder's `clientGone` after that, so open calls end as they do now.
6. Use the holder's sentence for the refusal: the client that was running the tool is no longer here.

## Validation

- A client leaves while a handler waits by id, and the handler gets a refusal.
- A client leaves while a handler waits by name and input, and the handler gets a refusal.
- A frame for a tool that is no longer on offer refuses the handler that waits for it.
- The other client's joins are not touched.
- `pnpm exec vitest run packages/sdk packages/agent-claude` passes.

## Resume
