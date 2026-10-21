---
title: The bot listing takes the owner filter
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** none.
