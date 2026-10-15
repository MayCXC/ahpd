---
title: A callback follows no redirect, and a refused turn is answered
status: todo
depends: [task-02-a-webhook-talks-to-a-bot-by-thread.md]
layer: "packages/webhook, docs"
refs:
  - "[code://packages/webhook/src/plugin.ts#L95-L118](../../../../packages/webhook/src/plugin.ts#L95-L118) - `send`, which notifies `dispatchAction` and never hears a refusal, and `post`, which follows a redirect"
  - "[code://packages/webhook/src/bot.ts#L176-L181](../../../../packages/webhook/src/bot.ts#L176-L181) - the call path that waits for the end and then sends the turn"
  - "[code://packages/sdk/src/host.ts#L739-L750](../../../../packages/sdk/src/host.ts#L739-L750) - `refuse`, which sends the sender an `action` with `rejectionReason` and the sender's `origin`"
  - "[code://packages/sdk/src/host.ts#L1340-L1351](../../../../packages/sdk/src/host.ts#L1340-L1351) - `dispatchAction` is a notification, so a refusal never comes back as an RPC error"
  - "[code://packages/sdk/src/types/plugin.ts#L144-L174](../../../../packages/sdk/src/types/plugin.ts#L144-L174) - `PluginPeer.onMessage`, where the plugin hears the echo"
  - "[code://packages/webhook/test/webhook-bot.test.ts](../../../../packages/webhook/test/webhook-bot.test.ts) - the bot cases to extend"
  - "[code://docs/WEBHOOKS.md#L88](../../../../docs/WEBHOOKS.md#L88) - the callback prefix paragraph, where the redirect line goes"
---

## Objective

A callback that answers with a redirect is a failed callback, and the plugin never follows it to another address.
A turn that the host refuses gets an error answer to the caller, instead of a 202 for a turn that never runs.

## Files

- `UPDATE: packages/webhook/src/plugin.ts:95-118` - `send` waits for the echo of its turn, and `post` passes `redirect: 'manual'`.
- `UPDATE: packages/webhook/src/bot.ts:32` - `send` gives the refusal reason, or `undefined` when the host took the turn.
- `UPDATE: packages/webhook/src/bot.ts:176-181` - a refused turn answers 409 with the reason, and its end is not awaited.
- `UPDATE: packages/webhook/test/webhook-bot.test.ts` - the cases below.
- `UPDATE: docs/WEBHOOKS.md:88` - one line that says a callback redirect is a failed callback.
- `UPDATE: docs/WEBHOOKS.md:103` - the 409 row names a turn the host refused.

## Steps

1. In `post`, pass `redirect: 'manual'` to `fetch`, so a 3xx answer throws through the `ok` check.
2. Keep one `clientSeq` counter on the plugin connection, and send it in each `dispatchAction`.
3. Set one `onMessage` handler that matches an `action` frame by `origin.clientId` and `origin.clientSeq`.
4. Subscribe to the chat before the dispatch, so the host echoes an accepted turn to the plugin.
5. Resolve `send` with `rejectionReason` when the echo carries one, and with `undefined` when it carries none.
6. Resolve `send` with a reason that names the wait when no echo comes in 10 seconds.
7. In `bot.ts`, answer 409 `{ message }` with the reason when `send` gives one, and report a problem line.
8. Drop the wait for the turn's end when `send` gives a reason, so no waiter stays.
9. Add the test cases below.
10. Add the redirect line and the 409 words to `docs/WEBHOOKS.md`.

## Validation

- `webhook-bot.test.ts`: a refused `send` answers 409 with the reason, and the plugin posts no callback.
- `webhook-bot.test.ts`: a refused `send` in a `sync` call answers 409 and does not wait for the timeout.
- A `post` test: a callback answers 307 to a second server. `post` throws, and the second server gets no request.
- A plugin test: an `action` frame with `rejectionReason` and the plugin's `clientSeq` resolves `send` with the reason.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/webhook`, `packages/sdk` and `packages/server`; all pass.
- By hand, on a test daemon: a callback that answers 307 gives a problem line. The redirect target gets nothing.

## Resume

