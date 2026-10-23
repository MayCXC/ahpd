---
title: A bot owns its session from the start
status: todo
depends: [task-01-the-host-names-a-plugins-session-first.md]
layer: "bot"
refs:
  - "[code://packages/bot/src/wake.ts#L340-L343](../../../../packages/bot/src/wake.ts#L340-L343) - the start, and `started.set` after it"
  - "[code://packages/bot/src/wake.ts#L396-L412](../../../../packages/bot/src/wake.ts#L396-L412) - `bindings`, the reader"
  - "[code://packages/bot/src/plugin.ts#L535](../../../../packages/bot/src/plugin.ts#L535) - the reader is registered"
---

## Objective

The bot keeps its session's URI under the bot before the session spawns, so the first tool list has the bot's action tools.

## Files

- `UPDATE: packages/bot/src/wake.ts:340-343` - pass `(uri) => started.set(uri, bot.id)` to the start, and remove the entry when the start fails.
- `UPDATE: packages/bot/src/wake.ts` - the `sessions.start` seam takes the `named` argument.
- `UPDATE: packages/bot/src/plugin.ts` - the seam passes `named` to `host.startSession`.
- `UPDATE: packages/bot/test/bot-wake.test.ts` - the reader answers the bot's connectors while the start runs, and nothing after a failed start.
- `UPDATE: packages/sdk/test/connector-actions.test.ts` - a session a plugin starts with a binding has the action tool in its first tool list.
- `UPDATE: CHANGELOG.md` - a bot's session has its connector actions from its first turn.

## Steps

1. Add `named?` to the wake's `sessions.start` seam.
2. Pass `named` from the bot plugin's seam to `host.startSession`.
3. In `woken`, pass a `named` that sets `started` to the bot's id.
4. Keep the `started.set` after the start, for a host that does not call `named`.
5. Remove the entry for that URI when the start rejects.
6. Add the bot tests.
7. Add the sdk test, with a reader that knows the URI from `named`.
8. Update the CHANGELOG.
9. Set this task and its plan row to `implemented`.

## Validation

- The reader answers the bot's connectors for the URI while the start still runs.
- A start that rejects after `named` leaves no entry in `started`.
- In the sdk test, the first `setTools` or spawn tool list has `<adapter>_<action>`.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, and the sdk and bot tests pass.

## Resume
