---
title: A bot's colour is a name or a hex colour
status: done
depends: []
layer: "packages/bot"
refs:
  - "[code://packages/bot/src/record.ts#L43-L49](../../../../packages/bot/src/record.ts#L43-L49) - `BOT_COLORS` and `BotColor`"
  - "[code://packages/bot/src/record.ts#L220](../../../../packages/bot/src/record.ts#L220) - the `color` check this task replaces"
  - "[code://packages/bot/test/bot-record.test.ts#L78-L86](../../../../packages/bot/test/bot-record.test.ts#L78-L86) - the record test for the lists"
  - "[code://packages/bot/test/bot-provider.test.ts#L258-L268](../../../../packages/bot/test/bot-provider.test.ts#L258-L268) - the provider test for the lists"
---

## Objective

A write takes `color` as one of the eleven names or as `#rrggbb`, and keeps a hex colour in lowercase.
Any other colour is refused `-32602`, as it is today.

## Files

- `UPDATE: packages/bot/src/record.ts:43-49` - `BotColor` becomes a name or a hex string; the docs comment says so.
- `UPDATE: packages/bot/src/record.ts:220` - the `color` check takes a name or `#rrggbb`, and lowercases a hex colour.
- `UPDATE: packages/bot/test/bot-record.test.ts:78-86` - cases for a hex colour, an uppercase one, and refused forms.
- `UPDATE: packages/bot/test/bot-provider.test.ts:258-268` - a make with a hex colour is kept and read back.
- `UPDATE: packages/bot/src/store.ts:59` - the load takes a stored hex colour, with `isBotColor`.
- `UPDATE: packages/bot/src/provider.ts:164` - the manifest's `color` is `anyOf` the names or the hex pattern.

## Steps

1. Change `BotColor` in `record.ts` to the type of a name in `BOT_COLORS` or a template string `#${string}`.
2. Add a `colour` function next to `among` that returns a name, or a lowercase `#rrggbb` string.
3. Make `colour` refuse any other value with `INVALID_PARAMS` and the message `among` gives.
4. Use `colour` for `color` in `checkRecord`, with the same fallback as today.
5. Add record tests: the check keeps `#2F6FDF` as `#2f6fdf` and refuses `#fff`, `2f6fdf` and `#2f6fdg`.
6. Add a provider test: a make with `#2f6fdf` reads back with that colour.

## Validation

- `pnpm vitest run packages/bot` passes, with the new cases.
- The repository typecheck passes.

## Resume
