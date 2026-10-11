---
title: A bot's first turn is a template
created: 2026-10-10
refs:
  - "[code://packages/bot/src/start.ts](../../packages/bot/src/start.ts) - `sessionFor`, which sends `instructions` as the first turn today"
---

A session of a bot starts with the bot's `instructions` as its first turn, and nothing else.
A template would build that turn from what the host knows about the bot: its name, its last sessions, and the work it has left.
The default template ships with the bot plugin, and a bot can name its own.

## What a template could fill in

| Placeholder | What it holds |
| --- | --- |
| the bot's name and description | the record |
| the bot's instructions | the record's body |
| the last sessions | the sessions linked to the bot, newest first, with their titles |
| pending work | a file in the bot's workspace that the bot keeps, such as `PENDING.md` |

## Open questions

- Where a template lives: `<configDir>/templates/<name>.md`, or in the bot file.
- Which placeholder syntax it uses, and what happens to a name it does not know.
- Whether an automation's message uses the same templates.
- Whether the template is read again for each new session, or once when the bot is made.

## Before it is planned

The bot file comes first: [plugin 45](../plans/plugin/45-a-plugin-keeps-records-in-the-host-store-p2-the-bot-keeps-its-records-there/plan.md).
