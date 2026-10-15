---
title: A bot's colour is a name or a hex colour - implemented
date: 2026-10-10
refs:
  - git://build/plugin-41 - the build, not merged yet
  - "[code://packages/bot/src/record.ts](../../../../packages/bot/src/record.ts) - `BotColor`, `isBotColor` and `colour`"
  - "[code://packages/bot/src/store.ts](../../../../packages/bot/src/store.ts) - `kept`, which loads a stored colour with `isBotColor`"
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - the manifest's `color`"
---

A bot's `color` is one of the eleven names or a hex colour, `#rrggbb`.
The host keeps a hex colour in lowercase, and refuses any other form with `-32602`.

## What was built

- [`code://packages/bot/src/record.ts`](../../../../packages/bot/src/record.ts) - `BotColor` is a name or a `#` string. `colour` checks a write and lowercases a hex colour. `isBotColor` checks a stored value. `among` has no change.
- [`code://packages/bot/src/store.ts`](../../../../packages/bot/src/store.ts) - `kept` uses `isBotColor`, so a bot with a hex colour loads at the next start.
- [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts) - the manifest's `color` is `anyOf` the eleven names or the hex pattern.
- `docs/plugins/BOTS.md` and `packages/bot/README.md` name the hex colour.

## Verified

- `pnpm -s typecheck` passes.
- `pnpm exec vitest run packages/bot` passes, 42 tests.
- The record test keeps `#2F6FDF` as `#2f6fdf`, and refuses `#fff`, `2f6fdf` and `#2f6fdg`.
- The provider test makes a hex bot, reads it back, and opens a new store on the same folder. With the old store check, that test fails.

## Departures from the plan

- Task 01 - the plan missed two places. The store's load refused a colour outside the names, so a hex bot was dropped at the next start. The manifest gave `color` as an enum of the names. Both are now rows in the plan's second table.
- ahpapp and ahpc read only a top-level `enum`, so they show a text field for `color` until they read `anyOf`.

## Left for later

- none.
