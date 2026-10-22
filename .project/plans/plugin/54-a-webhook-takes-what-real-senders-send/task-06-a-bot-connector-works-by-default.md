---
title: A bot connector works with its defaults
status: todo
depends: [task-03-a-webhook-reads-any-body.md]
layer: "webhook"
refs:
  - "[code://packages/webhook/src/record.ts#L71](../../../../packages/webhook/src/record.ts#L71) - `reply` defaults to `callback`"
  - "[code://packages/webhook/src/bot.ts#L105-L112](../../../../packages/webhook/src/bot.ts#L105-L112) - the check that refuses every call to an endpoint with no prefix"
  - "[code://packages/webhook/src/adapter.ts#L27-L126](../../../../packages/webhook/src/adapter.ts#L27-L126) - `FIELDS`, one field set for both alternatives"
---

## Objective

A bot connector made with only `bot` and `secret` answers its calls.
A connector that cannot work is refused when it is saved, not when it is called.

## Files

- `UPDATE: packages/webhook/src/record.ts:43-101` - the default `reply`, and the refusals below.
- `UPDATE: packages/webhook/src/adapter.ts:27-126` - the bot fields in the bot alternative only.
- `UPDATE: packages/webhook/test/webhook-kind.test.ts` - the cases below.

## Steps

1. Make `none` the default `reply`.
2. Refuse a put whose `reply` is `callback` with no `callbackPrefix`.
3. Move `reply`, `callbackPrefix` and `syncTimeoutSeconds` into the bot alternative of the `oneOf`.
4. Keep `secret`, `verifyToken` and every auth field in the top-level `properties`, where the host reads `writeOnly`.
5. Refuse a bot field on a connector with no `bot` in `checkEndpoint`.
6. Stop storing a `reply` on a connector with no `bot`.
7. Run the webhook tests, and set this task and the plan row to `implemented`.

## Validation

- `webhook-kind.test.ts`: a connector with only `bot` and `secret` answers a call with 202.
- `webhook-kind.test.ts`: the host answers `-32602` to a put with `reply: callback` and no `callbackPrefix`.
- `webhook-kind.test.ts`: the host refuses a put with `automation` and `reply`.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** the host's `writeOnly` read stops at the top-level `properties`; see the comment in `adapter.ts`.
