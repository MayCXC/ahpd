---
title: A finished turn marks its chat unread
status: implemented
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
A `!` command turn ends with the read bit it had at its start.

## Files

- `UPDATE: packages/sdk/src/host/spawn.ts:913-957` - after the dispatch of `chat/turnComplete`, `chat/turnCancelled` or `chat/error`, call `chatFlag` with `IsRead` false; the session sync of task 01 follows.
- `UPDATE: packages/sdk/src/host/spawn.ts:402-418` - after the worker's ending is sent, call `chatFlag` with `IsRead` false on the worker chat.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1032-1050` - keep the turn id of a `!` command turn, so the turn end can put its bit back.
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

### Built

- The chat `emit` in `spawn.ts` clears the chat bit on `chat/turnStarted`, `chat/turnResume` and `chat/inputRequested`.
- The protocol chat reducer clears the bit on the same three actions, so the host and a client agree during a turn.
- A client that marks the chat read during a turn keeps it read until the next of those actions.
- The chat `emit` marks the chat unread again after `chat/turnComplete`, `chat/turnCancelled` or `chat/error`.
- Each mark comes after the action and the chat row, and `sessionFollows` then moves the session.
- `HostContext.commandTurns` maps each `!` command turn id to the read bit its chat had at the turn start.
- `beginOrRun` adds the command turn id, or the queued message id when the command waits in the queue.
- The chat `emit` moves a queued id to the turn id and records the read bit when the turn starts.
- The end of a command turn puts back the recorded bit, and the session follows.
- A worker chat clears its bit on the same three actions, and its `end` marks it unread.

### Validation

- `host-catalogue.test.ts` tests that a turn start marks the chat and the session unread, after `chat/turnStarted`.
- It tests that a chat marked read during a turn stays read.
- It tests that the turn end then marks the chat unread after `chat/turnComplete`.
- It tests that a failed turn and a cancelled turn mark the chat and the session unread.
- `host-snapshots.test.ts` tests that a turn start clears the bit and that the host keeps a later client read.
- `host-terminals.test.ts` tests that a `!` command turn sends unread at the start and read at the end.
- `subagent-chat.test.ts` tests that a worker end marks the worker chat unread and leaves the session read.
- The agent-acp `types` helpers leave out `chat/isReadChanged`, because their tests read the ending as the last action.
- The agent-acp `statusAtEnd` helper leaves out the read bit, because it checks the activity at the end.
- Case 075 agrees on `status` again, so `HOST_OWNS` lists only `activeTurn` for it.
- The gates pass with the counts in task 01.

### Seen and not done

- The `askAgent` side chat runs a turn, so it marks the session unread.
- A `!` command turn that sends no ending keeps its id in `commandTurns`.
- A `!` command turn shows the chat and the session unread while it runs, and read again at its end.
