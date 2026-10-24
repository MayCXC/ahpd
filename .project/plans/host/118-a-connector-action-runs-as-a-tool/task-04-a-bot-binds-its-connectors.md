---
title: A bot binds its connectors
status: done
depends:
  - task-02-a-session-names-its-connectors.md
layer: "bot"
refs:
  - "[code://packages/bot/src/record.ts#L89-L122](../../../../packages/bot/src/record.ts#L89-L122) - `BotKept`, which gets `connectors`"
  - "[code://packages/bot/src/record.ts#L189-L200](../../../../packages/bot/src/record.ts#L189-L200) - `FIELDS`"
  - "[code://packages/bot/src/record.ts#L336-L352](../../../../packages/bot/src/record.ts#L336-L352) - `checkRecord`, which reads each field"
  - "[code://packages/bot/src/wake.ts#L202-L215](../../../../packages/bot/src/wake.ts#L202-L215) - `sessionFor`, the request a bot starts a session with"
---

## Objective

A bot record keeps `connectors`, the same alias map as the session key.
A session that the bot starts uses the bot's current map, read live through `registerBindings`.
A bot edit reaches a running session at its next tool list and its next call.

## Files

- `UPDATE: packages/bot/src/record.ts:89-122` - `connectors?: Record<string, string>` on `BotKept`.
- `UPDATE: packages/bot/src/record.ts:189-200` - `connectors` in `FIELDS`.
- `UPDATE: packages/bot/src/record.ts:336-352` - read and check the map, or keep the one the bot has.
- `UPDATE: packages/bot/src/plugin.ts` - register a bindings reader that answers the map of the bot that started the session.
- `UPDATE: packages/bot/test/bot-record.test.ts` - the field and its check.
- `UPDATE: packages/bot/test/bot-wake.test.ts` - the reader, before and after a bot edit.

## Steps

1. Add `connectors` to `BotKept`, with a comment that says what a value is.
2. Add `connectors` to `FIELDS`.
3. In `checkRecord`, refuse a value that is not an object of strings.
4. Refuse an alias or a value that `bindingsOf` skips.
5. Keep a map in memory from a session URI to the bot that started it, filled from the Back records.
6. Add a session to the map when the bot starts it, and remove it when its record goes.
7. Keep each bot's current `connectors` in memory, and replace them on each bot write.
8. Call `registerBindings` in `apply`, with a reader that answers the bot's map for a session in the map.
9. Answer nothing for a session that no bot started.
10. Add the tests, and run the bot tests.

## Validation

- `bot-record.test.ts`: a body with `connectors` keeps them, and `checkRecord` refuses a bad alias or URI.
- `bot-wake.test.ts`: the reader answers the bot's map for a session the bot started.
- `bot-wake.test.ts`: after a bot edit removes an alias, the reader no longer answers it.
- `bot-wake.test.ts`: the reader answers nothing for a session no bot started.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** every step, 1 to 10, and their tests.
  - `record.ts` has `connectors` on `BotKept` and on `BotDraft`, and in `FIELDS`. `checkRecord` reads it through `aliased`, which refuses a value that is not an object, an alias `isRecordSlug` refuses, and a value `bindingTarget` refuses - the two checks `bindingsOf` makes when it reads a session - and keeps the record's own map where the body names none, an empty map included.
  - `names.ts` has `BackSessions.sessions(bot)`: the sessions the bot's rows name, whatever the person and the name.
  - `wake.ts` keeps the map from a session to its bot. It is filled once when the wake is built, from `store.ready()` and each bot's rows, so a session a daemon that restarted left behind is answered as a fresh one is; a start puts its session in the map before its row is written. `Wake.bindings(session)` answers the bot's map as the store holds the bot now - which is step 7, since the store replaces a record on every write - and answers nothing for a session no bot started, or one whose bot record has gone, which empties the entry as it is read.
  - `plugin.ts` registers the reader with `host.registerBindings(wake.bindings)`.
  - Tests: `bot-record.test.ts` (11) and `bot-wake.test.ts` (14), and the bot package's 174. Build, typecheck and boundary pass.
- **Next action:** task 05.
- **Files:** `packages/bot/src/record.ts`, `packages/bot/src/names.ts`, `packages/bot/src/wake.ts`, `packages/bot/src/plugin.ts`, `packages/bot/src/provider.ts`, `packages/bot/package.json`. Tests: `packages/bot/test/bot-record.test.ts`, `packages/bot/test/bot-wake.test.ts`.
- **Open questions:** a bot's session is not handed the action tools at the list its backend is started with. The session's URI is minted inside `host.startSession`, and the host spawns before it answers that URI, so the reader cannot know which bot owns the session at the first tool list; every list after it has the tools. Closing this needs one of two things the plan does not decide: a session request that names its bindings (the `connectors` config key, refused by row 101 because a config key shadows the reader for a shared alias and for a removal), or a host door onto `registerBindings` that is told a session started under a plugin (the spawn happens before the plugin hears the URI). Both are forks the Answers table does not settle, so the gap is reported rather than chosen away.
- **Departures:** the Files list has no `provider.ts` and no `package.json`. The record a write composes is built field by field in `provider.ts`, so without `connectors` there a body's map never reached the store; and `registerBindings` needs the `bindings` contract in the manifest, added as `["*"]`. The store's own record is the live copy step 7 asks for - it replaces each bot on every write - so no second map of maps is kept. The `filled` read returns when the wake is built over no store, which is what the two `botWake({} as never)` calls in `bot-post.test.ts` make, so a wake made only to ask a tool its shape reports nothing.
- **Watch out for:** the store has one `onChange` ear and the provider holds it, so a deleted bot's session is emptied from the map where the reader is asked rather than when the delete happens. `sessionFor` must not seed `config.connectors`: the config key wins a shared alias and a removal over the reader, which is what task 02 tested. And the provider's read path answers the record whole, so `connectors` shows in a read of `bot://<slug>` without anything else being changed.

