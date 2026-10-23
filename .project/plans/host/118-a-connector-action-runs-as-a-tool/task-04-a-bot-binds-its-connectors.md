---
title: A bot binds its connectors
status: todo
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
