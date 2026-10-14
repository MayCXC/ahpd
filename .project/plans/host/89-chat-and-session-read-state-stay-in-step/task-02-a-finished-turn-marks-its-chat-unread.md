---
title: A finished turn marks its chat unread
status: todo
depends: [task-01-session-and-chat-read-bits-move-together.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L731-L957](../../../../packages/sdk/src/host/spawn.ts#L731-L957) - each chat's `emit`"
  - "[code://packages/sdk/src/host/spawn.ts#L402-L418](../../../../packages/sdk/src/host/spawn.ts#L402-L418) - a worker chat's `end`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1032-L1050](../../../../packages/sdk/src/host/lifecycle.ts#L1032-L1050) - the `!` command turn"
  - "git://github.com/microsoft/vscode@0817aaa8245 - `markUnreadContribution.ts`"
---

## Objective

A chat whose turn ends is unread, and its session is unread when the chat is counted.
A `!` command turn changes no read bit.

## Files

- `UPDATE: packages/sdk/src/host/spawn.ts:913-957` - after the dispatch of `chat/turnComplete`, `chat/turnCancelled` or `chat/error`, call `chatFlag` with `IsRead` false; the session sync of task 01 follows.
- `UPDATE: packages/sdk/src/host/spawn.ts:402-418` - after the worker's ending is sent, call `chatFlag` with `IsRead` false on the worker chat.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1032-1050` - keep the turn id of a `!` command turn, so the turn end can skip it.
- `UPDATE: packages/sdk/test/host-catalogue.test.ts` - the cases in Validation.

## Steps

1. Write the tests first.
2. Keep each `!` command turn id in a context set, and delete it at its turn end.
3. In the lead chat's `emit`, mark the chat unread at each ending, except for a command turn.
4. In the worker's `end`, mark the worker chat unread.
5. Place the mark after the ending's own dispatch, so a client applies the ending first.

## Validation

- A test: a turn that completes marks the chat unread and the read session unread.
- A test: a cancelled turn and a failed turn do the same.
- A test: a `!` command turn leaves the chat and the session read.
- A test: a worker that ends marks its chat unread and leaves the session read.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Not started.
