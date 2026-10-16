---
title: The docs name every kind of input request
status: done
depends: []
layer: "docs"
refs:
  - "[code://docs/sdk/AHP.md#L443-L452](../../../../docs/sdk/AHP.md#L443-L452) - the input request table"
  - "[code://packages/sdk/src/tools/clientcalls.ts#L228-L230](../../../../packages/sdk/src/tools/clientcalls.ts#L228-L230) - `toolClientExecution`, raised by the client call holder"
---

## Objective

`docs/sdk/AHP.md` names the four kinds of input request that the host serves, and the code that raises each one.

## Files

- `UPDATE: docs/sdk/AHP.md:443-452` - the table with four rows, and the sentence above it.

## Steps

1. Find the code that raises `toolConfirmation`, `chatInput`, `toolClientExecution` and `toolAuthentication`.
2. Replace the sentence above the table with one that names four kinds.
3. Add a row for each kind, with the code that raises it and the action that answers it.

## Validation

- Each row names a kind that `rg "kind: '<kind>'" packages` finds.
- `node <do-spec>/scripts/lint-prose.mjs docs/sdk/AHP.md` reports nothing new on the lines this task wrote.

## Resume

The section above the table said two kinds are served and the table named two, where `SessionInputRequestKind` has four. It now says four, and each kind has a row that names what it is, the code that raises it, and the action that answers it - the three the task asked for, folded into the table's two columns because that is the table's shape:

- `toolConfirmation` - raised where a backend stops a call to ask a person (`canUseTool`), answered by `chat/toolCallConfirmed`, keyed by `toolCall.toolCallId`.
- `chatInput` - raised where a backend puts an elicitation to a person, answered by `chat/inputCompleted`, keyed by `request.id`.
- `toolClientExecution` - raised by the client call holder as the frame reports the call, answered by `chat/toolCallComplete` from the client the call was reported against.
- `toolAuthentication` - raised where an MCP server's state turns `authRequired`, answered by the `authenticate` command rather than a `chat/*` action, with the host carrying on through `chat/toolCallAuthResolved` and `session/inputNeededRemoved`.

The sentence below the table said "Both are held in a map keyed by id", which counted the rows and so went wrong with them: it now says "All four", which is the only word in it that changed. That sentence is one line past the `443-451` the Files list named, and it was changed because the two added rows made its number wrong rather than for its own sake.

`node .agents/skills/do-spec/scripts/lint-prose.mjs docs/sdk/AHP.md` reports the same eleven findings it did before this task - all of them above line 440, none on a line this task wrote. Every kind in the table is one `rg "kind: '<kind>'" packages` finds: `toolConfirmation` and `chatInput` in every backend, `toolClientExecution` in `packages/sdk/src/tools/clientcalls.ts`, `toolAuthentication` in `packages/agent-claude/src/session/servers.ts`.

Files this task changed:

- `docs/sdk/AHP.md` - the sentence above the input request table, its two added rows, and the one word in the sentence below it.
