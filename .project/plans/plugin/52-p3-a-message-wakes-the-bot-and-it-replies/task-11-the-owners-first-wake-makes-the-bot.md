---
title: The owner's first wake makes the bot
status: todo
depends: [task-07-the-bots-rules-are-the-system-prompt.md, task-10-a-bots-folder-has-its-agents-file.md]
layer: "packages/bot"
refs:
  - "[code://packages/bot/src/template.ts](../../../../packages/bot/src/template.ts) - `DEFAULT_TEMPLATE`, which becomes the bot maker"
  - "[code://packages/bot/src/plugin.ts](../../../../packages/bot/src/plugin.ts) - the `templates` collection"
---

## Objective

A bot with no `AGENTS.md` is made in its owner's main chat, on the owner's first wake.
The default template is the bot maker: it asks the owner what the bot is for and writes `AGENTS.md`.
A manager template ships with ahpd, and the maker copies its text into `AGENTS.md` when the owner picks it.
The copy means that an ahpd update does not change a bot that exists.
"Never does direct work" is a choice of the manager template, not a rule of the host.

## Files

- `UPDATE: packages/bot/src/template.ts` - the maker text as `DEFAULT_TEMPLATE`, and the manager template.
- `UPDATE: packages/bot/src/wake.ts` - add the maker text to the instructions when `AGENTS.md` is absent and the person is the owner.
- `CREATE: packages/bot/test/bot-maker.test.ts` - the tests of the maker.

## Steps

1. Write the maker text: ask the owner what the bot is for, then write `AGENTS.md` in the folder.
2. Tell the maker to offer the manager template, and to copy its text into `AGENTS.md` when the owner picks it.
3. Ship the manager template with ahpd, beside the maker.
4. When the owner wakes a bot whose folder has no `AGENTS.md`, add the maker text to the instructions.
5. When another person wakes that bot, reply with a notice that the owner has not made the bot yet.
6. Fill the template words `name` and `description` from the record.

## Validation

- `bot-maker.test.ts`: test that the owner's first wake carries the maker text.
- `bot-maker.test.ts`: test that a wake with `AGENTS.md` present carries no maker text.
- `bot-maker.test.ts`: test that another person's wake gets the notice and starts no session.
- The gates pass: build, typecheck, boundary, schema and vitest.
