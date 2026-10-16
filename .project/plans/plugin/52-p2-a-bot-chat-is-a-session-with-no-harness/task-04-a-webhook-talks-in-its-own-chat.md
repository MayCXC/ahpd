---
title: A webhook talks in its own chat
status: done
depends: [task-03-a-bot-has-no-session-link.md]
layer: "packages/webhook, packages/server tests, docs"
refs:
  - "[code://packages/webhook/src/plugin.ts#L136-L170](../../../../packages/webhook/src/plugin.ts#L136-L170) - the `session` and `chat` seams, which read `session` off the bot"
  - "[code://packages/webhook/src/bot.ts#L24-L35](../../../../packages/webhook/src/bot.ts#L24-L35) - `BotSeams`"
  - "[code://packages/webhook/src/bot.ts#L142-L160](../../../../packages/webhook/src/bot.ts#L142-L160) - `botTarget`, which keeps one chat per thread"
  - "[code://packages/server/test/webhook-bot.test.ts](../../../../packages/server/test/webhook-bot.test.ts) - the end-to-end tests, which wait for `session`"
  - "[code://packages/bot/src/start.ts](../../../../packages/bot/src/start.ts) - `sessionFor`, unused after task 03"
---

## Objective

The webhook plugin reads a bot as a person does, and talks in the `chat` the read answers.
Every thread of a bot talks in that one chat.
A turn ends with no response until p3, so a webhook gets no reply text until then.

## Files

- `UPDATE: packages/webhook/src/plugin.ts` - the seam reads `chat` off the bot, and gives the default chat of that session.
- `UPDATE: packages/webhook/src/bot.ts` - `BotSeams` gives the bot's chat, and `botTarget` makes no chat per thread.
- `UPDATE: packages/webhook/test` - the unit tests of `botTarget` use the new seam.
- `UPDATE: packages/server/test/webhook-bot.test.ts` - the tests wait for the plugin's chat, not for `session`.
- `DELETE: packages/bot/src/start.ts` - `sessionFor` has no caller.
- `UPDATE: packages/bot/src/index.ts` - remove the `sessionFor` export.
- `UPDATE: docs/plugins/WEBHOOKS.md` - a bot endpoint talks in the plugin's own chat with the bot.

## Steps

1. Replace the `session` seam with `chat(bot)`, which reads the bot and returns its `chat` session URI.
2. Give the default chat of that session, as `session.state.defaultChat` names it.
3. Remove the `chat(session)` seam that calls `createChat`.
4. Keep the thread records, with the chat of the bot in place of a chat per thread.
5. Report a problem line that names `bot:chat` and `session:create` when the read answers no `chat`.
6. Change the grants of the end-to-end tests to `bot:get`, `bot:chat`, `session:read`, `session:create` and `session:write`.
7. Change the end-to-end tests to wait for the turn in the bot's chat, and to expect no reply text.
8. Keep the refusal test, with the grant the problem line names.
9. Delete `packages/bot/src/start.ts` and its export.
10. Update the docs where they say a webhook talks in the bot's session.

## Validation

- `pnpm -s exec vitest run packages/webhook packages/server/test/webhook-bot.test.ts packages/bot` passes.
- The gates pass: build, typecheck, boundary, schema and vitest.
