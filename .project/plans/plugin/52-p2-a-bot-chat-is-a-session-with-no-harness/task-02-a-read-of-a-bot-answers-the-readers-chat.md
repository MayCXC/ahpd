---
title: A read of a bot answers the reader's chat
status: todo
depends: [task-01-the-bot-chat-provider-keeps-a-chat-as-a-log.md]
layer: packages/bot
refs:
  - "[code://packages/bot/src/provider.ts#L447-L454](../../../../packages/bot/src/provider.ts#L447-L454) - `read`, which gains `chat`"
  - "[code://packages/bot/src/provider.ts#L60-L65](../../../../packages/bot/src/provider.ts#L60-L65) - `BotSessions`, with `start`"
  - "[code://packages/sdk/src/types/plugin.ts#L641](../../../../packages/sdk/src/types/plugin.ts#L641) - `startSession`, which asks the owner's `session:create`"
  - "[code://packages/bot/src/record.ts#L116-L123](../../../../packages/bot/src/record.ts#L116-L123) - `FIELDS`, which takes `chat` and drops it, as it does `createdAt`"
  - "[code://packages/bot/src/plugin.ts#L49-L82](../../../../packages/bot/src/plugin.ts#L49-L82) - `apply`, where the index collection is opened"
---

## Objective

A read of `bot:/<slug>` answers the record with one more key, `chat`: the URI of the reader's direct chat with that bot.
The plugin keeps an index in a records collection, `bot-chats`, with one row for each bot and person.
The first read by a reader who may chat starts the chat and writes the row.
The chat is a `bot-chat` session that the person owns, in the bot's folder, titled with the bot's name.
A reader may chat when they hold `bot:chat` or own the bot.
A reader who may not chat gets the record with no `chat` key.
A host with no users directory, or the root connection, chats as `root:<hostName>`.

## Files

- `UPDATE: packages/bot/src/provider.ts` - `read` answers `chat`, and starts the chat when the index has none.
- `UPDATE: packages/bot/src/record.ts` - `FIELDS` takes `chat` and drops it.
- `UPDATE: packages/bot/src/plugin.ts` - open the `bot-chats` collection and pass it to the provider.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - tests of `chat` on a read.

## Steps

1. Open the `bot-chats` collection in `apply`, with the row id `<slug>.<owner>` made safe for a record id.
2. Give the provider the collection beside `sessions`.
3. In `read`, find the reader's owner with `ownerOfPrincipal`, or `root:<hostName>` when there is no reader.
4. Answer the record with no `chat` when the reader neither holds `bot:chat` nor owns the bot.
5. Answer the row's URI as `chat` when the row is there and `sessions.owner` still knows it.
6. Otherwise start a `bot-chat` session for the owner, with `config: { bot: slug }`, and write the row.
7. Start one chat when two reads arrive together, so a person never gets two chats with one bot.
8. Take `chat` in `FIELDS` and drop it, so a client that writes back a read is not refused.
9. Write a test: a reader with `bot:chat` gets `chat`, and a second read answers the same URI.
10. Write a test: two people get two different chats with one bot.
11. Write a test: a reader with no `bot:chat` who does not own the bot gets no `chat`.
12. Write a test: the store keeps no `chat` from a write that carries it back.

## Validation

- `pnpm -s exec vitest run packages/bot` passes.
- The gates pass: build, typecheck, boundary, schema and vitest.
