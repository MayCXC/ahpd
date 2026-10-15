---
title: An archived chat is read
status: done
depends: [task-01-session-and-chat-read-bits-move-together.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L119-L159](../../../../packages/sdk/src/host/chatactions.ts#L119-L159) - the chat bit handler, with the default chat case at L135-L138"
  - "git://github.com/microsoft/vscode@0817aaa8245 - `chatArchiveContribution.ts`"
---

## Objective

A chat that is not the default chat is marked read when it is archived.

## Files

- `UPDATE: packages/sdk/src/host/chatactions.ts:139-159` - after `chatFlag` archives a chat that is unread, call `chatFlag` with `IsRead` true; the session sync of task 01 follows.
- `UPDATE: packages/sdk/test/host-catalogue.test.ts` - the cases in Validation.

## Steps

1. Write the tests first.
2. Mark the chat read only when the archive bit moved to on and the chat is unread.
3. Leave the default chat case at L135-L138 as it is, because it archives the session.

## Validation

- A test: archiving an unread peer chat sends `chat/isArchivedChanged`, then `chat/isReadChanged` true.
- A test: archiving the last unread peer chat also makes the session read.
- A test: unarchiving a chat changes no read bit.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

### Built

- The chat handler marks a chat read through `chatFlag` when its archive bit moves to on.
- `sessionFollows` then makes the session read when no counted chat stays unread.
- The default chat case is as it was, because it archives the session.
- Unarchive changes no read bit.

### Validation

- `host-catalogue.test.ts` tests that archiving an unread peer sends `chat/isArchivedChanged` and then `chat/isReadChanged`.
- It tests that archiving the last unread chat makes the session read.
- It tests that unarchiving sends only `chat/isArchivedChanged` and leaves the chat unread.
- `host-snapshots.test.ts` archive tests now expect `IsRead` in the chat and session status.
- The gates pass with the counts in task 01.

### Seen and not done

- Nothing.
