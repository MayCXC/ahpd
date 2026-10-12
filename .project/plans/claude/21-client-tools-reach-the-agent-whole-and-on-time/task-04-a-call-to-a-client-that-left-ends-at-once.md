---
title: A call to a client that left ends at once
status: done
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

A handler the CLI started waits for the frame that reports its call, in one of two joins: by the call's own id, in `asked`, or by the tool's name and the input, in `unclaimed` and `expecting`. Neither join says anything about who provides the tool, so a client that leaves left a handler parked on a call that would never open. `refuseJoins` is the one place that ends every join for one tool name, and `openCall`'s early return now uses it, so a frame that names a tool nothing offers answers the handler instead of leaving it; `clientGone` walks the tools whose names start with `mcp__ahp__<clientId>__` and refuses each, and then calls the holder's own `clientGone` so the calls already open end the way they did.

The steps did not say so, but the by-id join needed one more thing: `asked` was keyed by the CLI's call id alone, so a client leaving could not tell which tool a parked handler was waiting for. The wait now carries its tool name, `untilOpen` takes it, and `refuseJoins` and `clientGone` read it - which is what makes the first Validation case pass rather than only the second. The refusal is the holder's own sentence ("The client `<id>` that was running the tool is no longer here"), so both halves of one call read the same.

The cases are in `packages/agent-claude/test/agent-claude-client-gone.test.ts`, not `packages/sdk/test/host-tools.test.ts` as the Files list said, for the same reason as task 02: the joins live in this backend's `clienttools.ts`, and `packages/sdk` neither holds nor imports it. The cases build the small part of a session's context and drive the handler the SDK server was built with, which is the one thing that runs a call.

Files this task changed:

- `packages/agent-claude/src/session/clienttools.ts` - `refuseJoins` ends the by-id joins too, `asked` carries the tool with each wait, `openCall` refuses the joins of a tool nothing offers, and `clientGone` is added to `methods`.
- `packages/agent-claude/test/agent-claude-client-gone.test.ts` - new: by id, by name and input, a tool no longer on offer, and another client's joins.
