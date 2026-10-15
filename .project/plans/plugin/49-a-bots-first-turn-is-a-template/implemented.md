---
title: A bot's first turn is a template - implemented
date: 2026-10-15
refs:
  - git://040eb7b5
  - "[code://packages/bot/src/preamble.ts](../../../../packages/bot/src/preamble.ts)"
  - "[code://packages/sdk/src/host/preamble.ts](../../../../packages/sdk/src/host/preamble.ts)"
---

A bot's session opens with its template, filled with its name, its instructions and its last chats. Each new chat that a person or a tool opens gets the same template, in the hidden context of its first turn.

## What was built

- [`code://packages/bot/src/preamble.ts`](../../../../packages/bot/src/preamble.ts) - `botPreamble` fills the bot's template for a new chat. When the template is gone, it uses the default one and reports a problem.
- [`code://packages/sdk/src/host/preamble.ts`](../../../../packages/sdk/src/host/preamble.ts) - `preambleOf` and `withPreamble`, which ask every plugin and put the text before the first turn's context.
- [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts) - `createChat` asks the preambles, except for a fork.
- `registerChatPreamble` on the plugin host, and the `templates` record collection with a default template.
- `docs/BOTS.md` has the template, its words and the `lastChats` option.

## Verified

- `chat-preamble.test.ts`, `bot-preamble.test.ts`, `bot-template.test.ts` and `fill-words.test.ts` pass on main, 2026-10-15, in a run of 259 files and 4644 tests.
- On an isolated daemon, 2026-10-15: a bot made from a name and instructions opened with its filled template.
- A chat that the webhook plugin made in the bot's session knew the bot's name and listed its earlier chats.
- A bot write that names the template `nope` got `-32602` "The template nope does not exist."

## Departures from the plan

- none.

## Left for later

- The `{{pending}}` word and a changeset chat origin kind - see [deferred.md](deferred.md).
