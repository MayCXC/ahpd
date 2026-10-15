---
title: Session and chat read bits move together
status: implemented
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L27-L45](../../../../packages/sdk/src/host/chatactions.ts#L27-L45) - `sessionFlag`"
  - "[code://packages/sdk/src/host/chatactions.ts#L119-L159](../../../../packages/sdk/src/host/chatactions.ts#L119-L159) - the chat bit handler"
  - "[code://packages/sdk/src/host/chatrecord.ts#L101-L102](../../../../packages/sdk/src/host/chatrecord.ts#L101-L102) - `recordedChats`"
  - "git://github.com/microsoft/vscode@43ac7a4a236 - `agentHostStateManager.ts` read sync"
---

## Objective

A `chatFlag` helper sets one chat bit for any caller.
A change of the read bit on either level moves the other level by the rules in the plan's Answers.
A new session and a new chat start read.

## Files

- `UPDATE: packages/sdk/src/host/chatactions.ts:139-158` - move the bit change, the dispatch, the `session/chatUpdated` and `summaryMoved` into an exported `chatFlag(ctx, session, chat, bit, on)`, which answers whether the bit moved.
- `UPDATE: packages/sdk/src/host/chatactions.ts:119-159` - the handler calls `chatFlag`, then the session sync when the bit is `IsRead` and the chat is counted.
- `UPDATE: packages/sdk/src/host/chatactions.ts:27-45` - after a read change on the session, apply the chat sync: read marks every counted chat read, and unread with one counted chat marks that chat unread.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1417-1423` - a new session gets `IsRead` in the store before `sessionAdded`.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1146-1149` - a new chat gets `IsRead` in the store before `session/chatAdded`.
- `UPDATE: packages/sdk/test/host-catalogue.test.ts` - the cases in Validation, beside "keeps read and archived, and tells everyone watching" (L372).

## Steps

1. Write the tests first.
2. Extract `chatFlag` from the handler, with no change in behaviour.
3. Add `countedChats(ctx, session)`: the open chats of `recordedChats` whose origin kind is not `tool`.
4. In the handler, a counted chat that turns unread makes a read session unread through `sessionFlag`.
5. In the handler, when a counted chat turns read and no counted chat stays unread, mark the session read.
6. In `sessionFlag`, a session that turns unread with one counted chat marks that chat unread.
7. In `sessionFlag`, a session that turns read marks every counted chat read.
8. Guard each sync call with the moved answer, so that a bit that did not move sends nothing.
9. Set `IsRead` on a new session and on a new chat before the host announces it.

## Validation

- A test: a peer chat marked unread makes the read session unread.
- A test: the last unread chat marked read makes the session read; one unread chat left keeps it unread.
- A test: a session marked unread with one chat marks that chat unread.
- A test: a session marked read with two unread chats marks both read.
- A test: each chat that moved gets one `session/chatUpdated`.
- A test: the first summary of a new session and of a new chat shows `IsRead`.
- A test: a worker chat marked unread leaves the session read.
- A test: the same action twice sends nothing the second time.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

### Built

- `chatactions.ts` has `chatFlag`, which sets one chat bit, sends it on the chat and on the session, and moves the row.
- `countedChats` gives the open recorded chats of a session, without a `tool` origin and without a worker URI.
- `sessionFollows` makes a read session unread when a counted chat turns unread.
- `sessionFollows` makes the session read when a counted chat turns read and no counted chat stays unread.
- `sessionFlag` marks every counted chat read on a session read, and marks the one counted chat unread on a session unread.
- `startsRead` sets `IsRead` on a new chat before the host announces it.
- `openSession` sets `IsRead` on the new session and on its default chat before `session/ready`.
- `createChat`, a worker chat, the `createChat` tool and the side chat of `askAgent` call `startsRead`.
- The `createChat` tool and the `askAgent` side chat are not in the Files list. The Answer that a new chat starts read applies to them too.

### Validation

- `host-catalogue.test.ts` has a new group, "a session and its chats, read together", beside "the flags a client sets".
- The group tests the session sync, the chat sync, one `session/chatUpdated` per moved chat, start read, and a repeated action.
- The worker tests are in `subagent-chat.test.ts`, because that file has the worker fixture.
- Some tests in sdk now expect `IsRead` in a status outside a turn. A new session and a new chat start read.
- Two tests in sdk mark a chat or a session unread first, because marking a read item read sends nothing.
- `ahp-test-cases.test.ts` marks each driven session unread before a case runs, because almost every case starts unread.
- With that start, `HOST_OWNS` and its counts are as they were before this plan.
- Typecheck, boundary and schema pass. Vitest passes 4520 tests in 248 files.

### Seen and not done

- A catalogue session that nobody opened has no recorded chats, so a session read on it marks no chat.
- A chat that `moveChat` moves keeps its flags under the session it left.
