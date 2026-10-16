---
title: A bot has no session link
status: done
depends: [task-02-a-read-of-a-bot-answers-the-readers-chat.md]
layer: "packages/bot, docs"
refs:
  - "[code://packages/bot/src/record.ts#L80-L81](../../../../packages/bot/src/record.ts#L80-L81) - `BotRecord.session`"
  - "[code://packages/bot/src/record.ts#L176-L191](../../../../packages/bot/src/record.ts#L176-L191) - `link`"
  - "[code://packages/bot/src/provider.ts#L372-L375](../../../../packages/bot/src/provider.ts#L372-L375) - `mayLink`"
  - "[code://packages/bot/src/provider.ts#L505-L542](../../../../packages/bot/src/provider.ts#L505-L542) - the make that starts a harness session"
  - "[code://packages/bot/src/preamble.ts](../../../../packages/bot/src/preamble.ts) - the preamble, which finds a bot by its session"
  - "[code://packages/bot/src/plugin.ts#L67](../../../../packages/bot/src/plugin.ts#L67) - `registerChatPreamble`"
  - "[code://docs/plugins/BOTS.md](../../../../docs/plugins/BOTS.md) - the bot docs"
  - "[code://packages/bot/README.md](../../../../packages/bot/README.md) - the package readme"
---

## Objective

A bot record has no `session` field, and a make starts no session.
A body that names `session` is refused as a field a bot does not have.
The preamble goes, because no session is a bot's session now.
The docs say that a read answers `chat`, and that `bot:chat` lets a person chat with a bot.
No migration: a bot file that still has a `session` line loses it on its next write.

## Files

- `UPDATE: packages/bot/src/record.ts` - remove `session`, `link` and the key in `FIELDS`.
- `UPDATE: packages/bot/src/provider.ts` - remove `mayLink`, the start on a make, and `sessions.owner` where only the link used it.
- `DELETE: packages/bot/src/preamble.ts` - no bot owns a session to give a preamble to.
- `DELETE: packages/bot/test/bot-preamble.test.ts` - the tests of the preamble.
- `UPDATE: packages/bot/src/plugin.ts` - remove `registerChatPreamble`.
- `UPDATE: packages/bot/src/store.ts` - drop a `session` key when the store reads an old file.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - remove the session cases, and test the refusal of `session`.
- `UPDATE: packages/bot/test/bot-record.test.ts` - remove the session cases.
- `UPDATE: docs/plugins/BOTS.md` - remove the session link, and describe `chat`, `bot:chat` and the `bot-chat` provider.
- `UPDATE: packages/bot/README.md` - the same, in the list of fields.

## Steps

1. Remove `session` from `BotRecord`, `BotDraft`, `FIELDS` and `checkRecord`.
2. Remove `link` and `mayLink`.
3. Remove the block that starts a session on a make, and keep the folder made on a make.
4. Delete `preamble.ts`, its test and its registration.
5. Drop a `session` key that an old file holds, when the store reads it.
6. Write a test: the provider refuses a write with `session`, with "session is not something a bot has".
7. Write a test: a make starts no session.
8. Update `BOTS.md` and the readme.

## Validation

- `rg -n "session" packages/bot/src` names no bot session link.
- The gates pass: build, typecheck, boundary, schema and vitest.
