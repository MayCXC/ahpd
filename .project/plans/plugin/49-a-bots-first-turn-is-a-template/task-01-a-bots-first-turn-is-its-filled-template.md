---
title: A bot's first turn is its filled template
status: implemented
depends: []
layer: "packages/bot, packages/sdk, docs"
refs:
  - "[code://packages/sdk/src/wakemessage.ts#L33-L74](../../../../packages/sdk/src/wakemessage.ts#L33-L74) - `WAKE_PLACEHOLDERS`, `PLACEHOLDER` and `wakeMessage`, the filler this task opens to a map of words"
  - "[code://packages/sdk/src/index.ts#L59](../../../../packages/sdk/src/index.ts#L59) - the export line beside `wakeupTool`, where the filler is exported"
  - "[code://packages/bot/src/start.ts#L4-L38](../../../../packages/bot/src/start.ts#L4-L38) - `sessionFor`, which sends `instructions` as the prompt now"
  - "[code://packages/bot/src/record.ts#L52-L120](../../../../packages/bot/src/record.ts#L52-L120) - `BotRecord`, `BotDraft` and `FIELDS`, which gain `template`"
  - "[code://packages/bot/src/record.ts#L231-L245](../../../../packages/bot/src/record.ts#L231-L245) - the draft `checkRecord` returns, which reads `template`"
  - "[code://packages/bot/src/provider.ts#L65-L85](../../../../packages/bot/src/provider.ts#L65-L85) - `BotOptions`, which gains the seam that reads a template and the work left"
  - "[code://packages/bot/src/provider.ts#L172-L199](../../../../packages/bot/src/provider.ts#L172-L199) - `manifest`, the make form, which offers `template`"
  - "[code://packages/bot/src/provider.ts#L490-L530](../../../../packages/bot/src/provider.ts#L490-L530) - the write: `checkRecord`, the record it builds, and the make that starts a bot's session with `sessionFor`"
  - "[code://packages/bot/src/plugin.ts#L27-L60](../../../../packages/bot/src/plugin.ts#L27-L60) - `defaults`, `optionsSchema` and `apply`, where the plugin opens its collections"
  - "[code://packages/sdk/src/types/records.ts#L40-L60](../../../../packages/sdk/src/types/records.ts#L40-L60) - `CollectionOptions.body` and `RecordCollection.get`, which read a template"
  - "[code://docs/BOTS.md#L174-L184](../../../../docs/BOTS.md#L174-L184) - the plugin's options and where its records are kept"
  - "[code://packages/bot/test/bot-provider.test.ts#L255-L264](../../../../packages/bot/test/bot-provider.test.ts#L255-L264) - the make form's fields, which gain `template`"
  - "[code://packages/bot/test/bot-provider.test.ts#L768-L779](../../../../packages/bot/test/bot-provider.test.ts#L768-L779) - the case that expects the bare instructions as the first turn"
  - "[code://packages/bot/test/bot-provider.test.ts#L821-L832](../../../../packages/bot/test/bot-provider.test.ts#L821-L832) - the case that expects a silent session for a bot with no instructions"
  - "[code://docs/BOTS.md#L9-L26](../../../../docs/BOTS.md#L9-L26) - the record table, which gains `template`"
  - "[code://packages/bot/README.md#L83](../../../../packages/bot/README.md#L83) - the list of fields a body may carry"
---

## Objective

A bot's session opens with its template, filled by the wake filler with the words `name`, `description`, `instructions` and `chats`.
A bot names its template as `template: <name>`, and a bot that names none gets the default template that the plugin ships.
A template is a record in the `templates` collection, so the default store keeps it as `<configDir>/templates/<name>.md`.
Its frontmatter holds `title`, and its body is the text that the words fill.
A bot write that names a template that does not exist is refused.

The default template, as `DEFAULT_TEMPLATE` holds it, is text with no frontmatter:

```md
You are {{name}}. {{description}}

{{instructions}}

## Your last chats

{{chats}}
```

## Files

- `UPDATE: packages/sdk/src/wakemessage.ts:33-74` - add `fillWords(text, words)`, which fills each `{{word}}` the map holds and leaves every other name as written; `wakeMessage` calls it.
- `UPDATE: packages/sdk/src/index.ts:59` - export `fillWords` from `./wakemessage.js`.
- `CREATE: packages/sdk/test/fill-words.test.ts` - cases for the filler with a map of words.
- `CREATE: packages/bot/src/template.ts` - `DEFAULT_TEMPLATE`, `TEMPLATE_WORDS`, the `chats` lines and `firstTurn(bot, template, chats)`.
- `UPDATE: packages/bot/src/record.ts:52-120` - add `template?: string` to `BotRecord` and `BotDraft`, and `'template'` to `FIELDS`.
- `UPDATE: packages/bot/src/record.ts:231-245` - read `template` with `line`, and refuse a name that is not a slug with `-32602`.
- `UPDATE: packages/bot/src/start.ts:4-38` - `sessionFor(bot, prompt)` sends the filled template as `prompt`, not `bot.instructions`.
- `UPDATE: packages/bot/src/provider.ts:65-85` - add a `templates` seam to `BotOptions` that reads a template by name and gives the `lastChats` count.
- `UPDATE: packages/bot/src/provider.ts:172-199` - offer `template` in `manifest`.
- `UPDATE: packages/bot/src/provider.ts:490-530` - refuse a write whose template does not exist, keep `template` on the record, and fill the template before the make starts the session.
- `UPDATE: packages/bot/src/plugin.ts:27-60` - add the `lastChats` option, open `host.records('templates', { body: 'text' })`, and pass the `templates` seam to `botProvider`.
- `CREATE: packages/bot/test/bot-template.test.ts` - cases for the default template, a template record, the four words and `lastChats`.
- `UPDATE: packages/bot/test/bot-record.test.ts` - cases for `template` on a make and on an edit.
- `UPDATE: packages/bot/test/bot-provider.test.ts:255-264` - expect `template` among the make form's fields.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - add cases for a write whose template does not exist and a write whose template does.
- `UPDATE: packages/bot/test/bot-provider.test.ts:768-779` - expect the filled default template as the first turn, with the model on it.
- `UPDATE: packages/bot/test/bot-provider.test.ts:821-832` - expect a first turn for a bot with no instructions too, filled from the default template.
- `UPDATE: docs/BOTS.md:9-26` - add the `template` row, and say that `instructions` goes into the template.
- `UPDATE: docs/BOTS.md:80-90` - add a section on the first turn, with the default template, a template file and the four words.
- `UPDATE: docs/BOTS.md:174-184` - add the `lastChats` option, and say that templates are kept in `<configDir>/templates/`.
- `UPDATE: packages/bot/README.md:83` - add `template` to the fields a body may carry.
- `UPDATE: packages/bot/README.md:112` - say that the first turn is the filled template.

## Steps

1. Read the plan's *Open questions*, and stop to ask Softov while one of them names task 01.
2. Write `packages/sdk/test/fill-words.test.ts` with the cases in *Validation*.
3. Run `pnpm exec vitest run packages/sdk/test/fill-words.test.ts` and see it fail.
4. Add `fillWords(text: string, words: Readonly<Record<string, string>>): string` to `wakemessage.ts`, with `PLACEHOLDER` as its pattern.
5. Fill a name with `Object.hasOwn(words, name)`, and leave every other `{{name}}` exactly as written.
6. Make `wakeMessage` call `fillWords` with its six words, and keep its summary block.
7. Export `fillWords` from `packages/sdk/src/index.ts`, and see the filler tests pass.
8. Write `packages/bot/test/bot-template.test.ts`, add the `template` cases to `bot-record.test.ts`, and see both fail.
9. Change the three cases in `bot-provider.test.ts` that *Files* names, and see them fail.
10. Create `packages/bot/src/template.ts` with `TEMPLATE_WORDS = ['name', 'description', 'instructions', 'chats']`.
11. Put the default template below in `template.ts` as `DEFAULT_TEMPLATE`, with no other text.
12. Fill `name` with `bot.name`, `description` with `bot.description ?? ''`, and `instructions` with `bot.instructions ?? ''`.
13. Fill `chats` with one line `- <title>` per chat of the bot's session, newest first by `modifiedAt`.
14. Limit the `chats` lines to the `lastChats` option, which is 10 by default.
15. Fill `chats` with `None.` when the bot has no chats, which is every make.
16. Export `firstTurn(bot, template, chats)`, which calls `fillWords` with the four words.
17. Add `template?: string` to `BotRecord` and `BotDraft`, and `'template'` to `FIELDS` in `record.ts`.
18. Read `template` in `checkRecord` with `line`, keep the existing value on an edit, and refuse a non-slug name with `-32602`.
19. Add `template` to `manifest` in `provider.ts`, as a string that names a record in `templates`.
20. Add `lastChats` to `optionsSchema` and `defaults` in `plugin.ts`, as an integer of 1 or more, 10 by default.
21. Add `templates: BotTemplates` to `BotOptions`, with `text(name)` and `lastChats`.
22. In `plugin.ts`, make `text(name)` answer the body of `templates.get(name)`, or `undefined` when the record does not exist.
23. Check the name with `isSlug` again in the reader, because a person can edit a bot file by hand.
24. After `checkRecord`, refuse a write whose template does not exist with `-32602` and `The template <name> does not exist.`
25. Add `template` to the record that the write builds, beside `instructions`.
26. Use `DEFAULT_TEMPLATE` when the bot names no template.
27. Change `sessionFor(bot)` to `sessionFor(bot, prompt)`, and send `prompt` in place of `bot.instructions`.
28. In the make at `provider.ts:527-530`, fill the template with no chats, then pass the text to `sessionFor`.
29. Update the doc comment on `sessionFor`: the first turn is the filled template, and a bot never opens silent.
30. Run `pnpm exec vitest run packages/bot packages/sdk`, and see every case pass.
31. Add the `template` row to the record table in `docs/BOTS.md`, and change the `instructions` row.
32. Add the section `## The first turn` to `docs/BOTS.md`, after `## The session`, with the default template and the four words.
33. In that section, show a template file with its `title`, and say that a missing template refuses the write.
34. Say there that the filler keeps an unknown word as written.
35. Add `lastChats` to the options table in `docs/BOTS.md`, and name `<configDir>/templates/` beside the other collections.
36. Update `packages/bot/README.md` at lines 83 and 112 to match.
37. Run every gate in *Validation*.

## Validation

- `packages/sdk/test/fill-words.test.ts` fills each word of the map, and fills a word that occurs twice.
- The same file leaves `{{other}}` as written, and fills an empty value as nothing.
- `packages/sdk/test/automation-wake.test.ts` still passes, so `wakeMessage` fills the six wake words and ends with its summary.
- `packages/bot/test/bot-template.test.ts` fills `DEFAULT_TEMPLATE` for a bot with each of the four words and checks the text.
- The same file fills the body of a template record that has a `title`.
- The same file uses the default template when a bot names none.
- The same file lists no more chats than `lastChats`, and lists 10 when the option is not set.
- The same file fills `None.` when the bot has no chats.
- The same file lists chats newest first with their titles, and leaves `{{unknown}}` in a template as written.
- `packages/bot/test/bot-record.test.ts` takes `template: 'short'`, refuses `template: '../x'` with `-32602`, and keeps the template on an edit that does not name one.
- `packages/bot/test/bot-provider.test.ts` sees `template` in the make form, and sees a first turn with the instructions and the model.
- The same file refuses a make that names a missing template with `-32602`, and the message names the template.
- The same file sees the text of a named template in the first turn.
- The same file sees a first turn for a bot with no instructions, which is the default template filled.
- `pnpm -s typecheck` passes.
- `pnpm -s boundary` passes.
- `pnpm -s schema` passes.
- `pnpm exec vitest run packages/bot packages/sdk` passes.
- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs docs/BOTS.md` reports nothing on the lines this task wrote.

## Resume


Built in `packages/sdk/src/wakemessage.ts` and the bot package. `fill-words.test.ts` has 6 cases, and `bot-template.test.ts` has 8. `bot-record.test.ts` gained 1 case, and `bot-provider.test.ts` gained 3 and changed 3.

How the parts work:

- `fillWords(text, words)` replaces each `{{name}}` and `{{name.field}}` that the map holds, and leaves the others as written.
- `wakeMessage` builds its `event.<field>` words from the text, then fills through `fillWords`.
- `template.ts` holds `DEFAULT_TEMPLATE`, `templateOf`, `chatLines` and `firstTurn`.
- `plugin.ts` reads templates with `host.records('templates', { body: 'text' })`, and offers the option `lastChats`, 10 by default.
- A bot write that names a missing template is refused with the sentence "The template <name> does not exist."
- `sessionFor` always sends a prompt, which is the filled template.
- At the make, the bot has no chats, so `{{chats}}` is `None.`.

Where the build departs from the plan:

- An edit reads the template only when its body names `template`. So a bot whose template was deleted can still be edited.
- `templateOf` and `chatLines` are exported, so task 03 and the tests use them.
- `fillWords` looks up a dotted name as one key, such as `event.repo`.
- `fill-words.test.ts` has an extra case: a word named like an `Object` prototype key is left as written.

Open questions:

- Should an edit that does not name `template` be refused when the bot's kept template was deleted? The build takes the smaller option and lets it pass.

Gates: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass. `pnpm exec vitest run packages/sdk packages/server packages/bot packages/webhook` passes 4015 of 4017 tests.
The 2 failures are timeouts under load in `nested-proxy.test.ts` and `nested-start.test.ts`, which do not use the files this task changed. `nested-proxy` passes alone, and `nested-start` passes with `--testTimeout 30000`.
