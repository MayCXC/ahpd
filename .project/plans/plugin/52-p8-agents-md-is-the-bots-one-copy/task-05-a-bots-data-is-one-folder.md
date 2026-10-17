---
title: A bot's data is one folder
status: todo
depends: [task-02-the-persona-is-read-from-agents-md.md]
layer: "packages/sdk, packages/bot"
refs:
  - "[code://packages/sdk/src/plugins.ts#L987-L1002](../../../../packages/sdk/src/plugins.ts#L987-L1002) - `records` takes only a slug, so a collection cannot be in a subfolder"
  - "[code://packages/bot/src/provider.ts#L77](../../../../packages/bot/src/provider.ts#L77) - the `bot-chats` collection"
  - "[code://packages/bot/src/names.ts#L24](../../../../packages/bot/src/names.ts#L24) - the `bot-sessions` collection"
  - "[code://packages/bot/src/chat.ts#L129](../../../../packages/bot/src/chat.ts#L129) - the chat logs in `bot-chats/`"
---

## Objective

All the data of one bot is in `<configDir>/bots/<slug>/`: its record, its main chat rows, its back session rows and its chat logs.
A delete of the bot removes that folder.
The bot's work folder, such as `~/.bots/<slug>`, stays after a delete.

## Files

- `UPDATE: packages/sdk/src/plugins.ts` - let a plugin open a collection in a subfolder of its own.
- `UPDATE: packages/bot/src/provider.ts` - the record and the `bot-chats` rows in the bot's folder, and a delete that removes it.
- `UPDATE: packages/bot/src/names.ts` - the `bot-sessions` rows in the bot's folder.
- `UPDATE: packages/bot/src/chat.ts` - the chat logs in the bot's folder.
- `UPDATE: packages/bot/src/plugin.ts` - move the data of each bot into its folder at load.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - the tests of the folder and the delete.

## Steps

1. Find how a plugin can keep records in `bots/<slug>/`, and stop to ask if it needs a change to `records`.
2. Put the record at `bots/<slug>/bot.md`.
3. Put the main chat rows in `bots/<slug>/chats/` and the back session rows in `bots/<slug>/sessions/`.
4. Put the chat logs in `bots/<slug>/logs/`.
5. At load, move the rows and logs of each bot from `bot-chats/` and `bot-sessions/` into its folder.
6. Move the rows of a deleted bot into its tombstone in `bots-gone/`, or remove them.
7. Make a delete remove `bots/<slug>/` after it writes the tombstone.

## Validation

- `bot-provider.test.ts`: test that a delete removes the bot's folder and keeps its work folder.
- `bot-provider.test.ts`: test the move at load from the old layout.
- The gates pass: build, typecheck, boundary, schema and vitest.
