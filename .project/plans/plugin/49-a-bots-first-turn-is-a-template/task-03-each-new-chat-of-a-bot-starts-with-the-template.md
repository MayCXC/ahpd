---
title: Each new chat of a bot starts with the template
status: todo
depends: [task-01-a-bots-first-turn-is-its-filled-template.md, task-02-a-plugin-gives-a-new-chats-preamble.md]
layer: "packages/bot, docs"
refs:
  - "[code://packages/bot/src/plugin.ts#L39-L60](../../../../packages/bot/src/plugin.ts#L39-L60) - `apply`, where the plugin registers its preamble"
  - "[code://packages/bot/src/store.ts#L39-L58](../../../../packages/bot/src/store.ts#L39-L58) - `BotStore`, whose `all()` finds the bot that owns a session"
  - "[code://packages/sdk/src/host/changesets.ts#L296-L309](../../../../packages/sdk/src/host/changesets.ts#L296-L309) - a changeset chat, which has the origin kind `sideChat` and which the host does not ask about"
  - "[code://docs/BOTS.md#L80-L90](../../../../docs/BOTS.md#L80-L90) - the session, which gains the template on each new chat"
---

## Objective

A chat that a person or a tool opens in a bot's session starts with the template, filled again as task 01 fills it.
The bot plugin gives the template through the chat preamble of task 02, as hidden context before `initialMessage`.
A chat opened with no `initialMessage` gets the template with the person's first message.
The first chat of task 01 opens with the session, not through `createChat`, so it gets the template once.
When the bot's template no longer exists, the chat gets the default template, and the plugin reports a problem.

## Files

- `CREATE: packages/bot/src/preamble.ts` - `botPreamble(store, templates, problem)`, the `ChatPreamble` the bot plugin registers.
- `UPDATE: packages/bot/src/plugin.ts:39-60` - register `botPreamble` with `host.registerChatPreamble`.
- `CREATE: packages/bot/test/bot-preamble.test.ts` - cases for a bot's new chat, a session that is not a bot's, `{{chats}}` and a deleted template.
- `UPDATE: docs/BOTS.md:80-90` - say that each new chat of a bot starts with the filled template.
- `UPDATE: packages/bot/README.md:112` - say that each new chat starts with the filled template.

## Steps

1. Read the plan's *Open questions*, and stop to ask Softov while one of them names task 03.
2. Write `packages/bot/test/bot-preamble.test.ts` with the cases in *Validation*.
3. Run `pnpm exec vitest run packages/bot/test/bot-preamble.test.ts` and see it fail.
4. Create `packages/bot/src/preamble.ts` with `botPreamble(store, templates, problem)`, which answers a `ChatPreamble`.
5. Wait for `store.ready()`, and find the bot whose `session` is the opened chat's session.
6. Answer `undefined` when no bot owns the session.
7. Read the bot's template from the `templates` seam each time, so an edit to a template reaches the next chat.
8. Use `DEFAULT_TEMPLATE` when the bot names no template.
9. When the named template does not exist, use `DEFAULT_TEMPLATE` and report a problem that names the bot and the template.
10. Sort the opened chat's `chats` newest first by `modifiedAt`, and keep the first `lastChats`.
11. Answer `firstTurn(bot, template, chats)` from task 01.
12. Register `botPreamble` in `apply` with `host.registerChatPreamble`, and give it `host.problem` as `problem`.
13. Run `pnpm exec vitest run packages/bot`, and see every case pass.
14. Say in `docs/BOTS.md` that a chat a person or a tool opens starts with the filled template.
15. Say there that a missing template gives the default template and a problem.
16. Say there that a chat with no first message gets the template with the person's first message.
17. Update `packages/bot/README.md` at line 112 to match.
18. Run every gate in *Validation*.

## Validation

- `packages/bot/test/bot-preamble.test.ts` opens a chat in a bot's session, and gets the filled template.
- The same file opens a chat in a session that is not a bot's, and gets `undefined`.
- The same file gives three other chats, and sees `{{chats}}` list their titles newest first.
- The same file sets `lastChats` to 2, and sees two titles.
- The same file deletes the bot's template, and gets the default template and one problem.
- The same file edits the bot's template, and gets the new text on the next chat.
- `packages/bot/test/bot-provider.test.ts` still passes.
- `pnpm -s typecheck` passes.
- `pnpm -s boundary` passes.
- `pnpm -s schema` passes.
- `pnpm exec vitest run packages/bot packages/sdk` passes.
- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs docs/BOTS.md` reports nothing on the lines this task wrote.

## Resume

