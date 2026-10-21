---
title: A bot chat is a session with no harness - implemented
date: 2026-10-16
refs:
  - git://b4cf91dc
  - "[code://packages/bot/src/chat.ts](../../../../packages/bot/src/chat.ts) - the `bot-chat` agent and its logs"
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - `chatOf`, the read that answers `chat`"
  - "[code://packages/webhook/src/plugin.ts](../../../../packages/webhook/src/plugin.ts) - the webhook's seam, which reads `chat`"
  - "[code://packages/sdk/src/plugins/validate.ts](../../../../packages/sdk/src/plugins/validate.ts) - `OWNER`, which takes `plugin:`"
---

A person talks to a bot in a chat of their own. A read of `bot:/<slug>` answers `chat`, the session URI of the reader's chat, and the first read starts it. The chat is a session of the `bot-chat` agent, which runs no model, so a turn ends with no response until p3.

## What was built

- [`code://packages/bot/src/chat.ts`](../../../../packages/bot/src/chat.ts) - the `bot-chat` agent. It keeps each turn as one JSON line under `<configDir>/bot-chats/`, so a chat replays after a restart.
- [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts) - a read answers `chat` to the bot's owner and to a holder of `bot:chat`. The `bot-chats` collection holds one row per bot and person.
- [`code://packages/bot/src/record.ts`](../../../../packages/bot/src/record.ts) - a bot has no `session`. A make starts no session. The store drops a `session` key that an old file holds.
- [`code://packages/webhook/src/plugin.ts`](../../../../packages/webhook/src/plugin.ts) - a webhook reads `chat` off the bot, and every thread talks in the default chat of that session.
- `preamble.ts` and `start.ts` are deleted.
- `docs/plugins/BOTS.md`, `docs/plugins/WEBHOOKS.md` and `packages/bot/README.md` describe the chat and the `bot:chat` grant.

## Verified

- `bot-chat.test.ts`, `bot-provider.test.ts`, `bot-store.test.ts`, `bot-catalogue.test.ts`, `packages/webhook/test/webhook-bot.test.ts` and `packages/server/test/webhook-bot.test.ts`.
- After the rebase onto `e6fc0c91`: build, typecheck, boundary, schema and `git diff --quiet tools/` pass. Vitest has 297 files and 5263 tests, and all pass.

## Departures from the plan

- Task 04 changes `packages/sdk/src/plugins/validate.ts`, which its Files list does not name. `OWNER` takes `plugin:`, because the webhook's chat is owned by `plugin:webhook`. A plugin can already start a session as `root:`, so this gives a plugin no new power.
- The rebase kept the bot body fix of `f2fccac7`: the store keeps any body and drops `session`.

## Left for later

- p3 makes the bot reply.
- A plugin can name any `plugin:<name>` as an owner. The tighter rule is the plugin that asks.
- `beginPluginSession` asks `session:create` of a `user:` owner only, so a plugin's chat asks no grant of the plugin.
