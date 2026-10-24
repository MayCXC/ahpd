---
title: The bot listing takes the owner filter
status: done
depends: []
layer: plugin
refs:
  - "[code://packages/bot/src/provider.ts#L280-L287](../../../../packages/bot/src/provider.ts#L280-L287) - `mayRead` of a bot"
  - "[code://packages/bot/src/provider.ts#L570-L579](../../../../packages/bot/src/provider.ts#L570-L579) - `list` on `bot:/`"
  - "[code://packages/bot/test/bot-provider.test.ts](../../../../packages/bot/test/bot-provider.test.ts) - the bot listing cases"
---

## Objective

`bot:/?owner=me` answers only the bots whose owner is the caller.

## Files

- `UPDATE: packages/bot/src/provider.ts:570-579` - read the query with `ownerFilter` and filter the bots.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - the cases below.

## Steps

1. In `list` on `bot:/`, read the query with `ownerFilter` and the reader.
2. Apply `mayRead` and `bot:list` as now, then keep only the bots whose `owner` equals the filter.
3. Add a case where a reader with `bot:list` gets only their own bots with the filter.
4. Add a case where a team bot the reader may read is not in the filtered answer.
5. Run the bot tests, and set this task and the plan row to `implemented`.

## Validation

- The bot tests pass from the repository root.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** `split` keeps the query apart from the path, so `bot:/?owner=me` is the root listing rather than a bot named `?owner=me`. `list` on `bot:/` reads it with `ownerFilter` after the `bot:list` and `mayRead` answer, and keeps the bots whose `owner` equals the caller's. `bot-provider.test.ts` has the reader with `bot:list` who sees their own bot only when asked. It also has the team bot they may read that the filtered listing leaves out. `bot-store.test.ts` has the filtered listing with no reader, which is empty.
- **Next action:** the plan's gates and its index row.
- **Open questions:** none.
- **Watch out for:** the filter is applied last, so it never widens an answer. A bot a reader could not list before is not in a filtered listing either.
