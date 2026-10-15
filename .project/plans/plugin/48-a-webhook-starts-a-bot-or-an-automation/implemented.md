---
title: A webhook talks to a bot or fires an automation - implemented
date: 2026-10-15
refs:
  - git://82b29871
  - "[code://packages/webhook/src/plugin.ts](../../../../packages/webhook/src/plugin.ts)"
  - "[code://packages/webhook/src/bot.ts](../../../../packages/webhook/src/bot.ts)"
  - "[code://packages/sdk/src/host/automations.ts](../../../../packages/sdk/src/host/automations.ts)"
---

A program outside the host can talk to a bot or fire an automation by a call to a URL.
A bot call with a thread id continues the same chat, also after a restart, because host/92 keeps the bot session's folder.
An automation run can name the fields of the call in its prompt.
Each endpoint has its own secret, and routes can listen on a public port of their own.

## What was built

- [`code://packages/webhook/src/route.ts`](../../../../packages/webhook/src/route.ts) - the route, which finds the endpoint record and checks the bearer.
- [`code://packages/webhook/src/record.ts`](../../../../packages/webhook/src/record.ts) - the endpoint record and its check.
- [`code://packages/webhook/src/bot.ts`](../../../../packages/webhook/src/bot.ts) - a bot call: the thread map, the turn, and the reply as a callback, a sync answer or none.
- [`code://packages/webhook/src/automation.ts`](../../../../packages/webhook/src/automation.ts) - an automation call, which fires the `webhook` trigger.
- [`code://packages/webhook/src/plugin.ts`](../../../../packages/webhook/src/plugin.ts) - the seams over the plugin's connection, the dispatcher that hears a refusal, and `callBack`, which follows no redirect.
- [`code://packages/sdk/src/wakemessage.ts`](../../../../packages/sdk/src/wakemessage.ts) - `{{event.<field>}}` in a run's prompt.
- [`code://packages/sdk/src/host/automations.ts`](../../../../packages/sdk/src/host/automations.ts) - `fired` matches a trigger's `config` against the keys of the fire's data.
- [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts) - the `routes` setting, a listener for public routes only.
- [`code://docs/WEBHOOKS.md`](../../../../docs/WEBHOOKS.md) - the operator guide.

## Verified

- `packages/webhook/test` holds the route, record, bot and automation cases.
- `packages/server/test/webhook-bot.test.ts` runs a bot call end to end with a users directory.
- `plugin-route.test.ts`, `plugin-triggers.test.ts` and `automation-wake.test.ts` have the host cases.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest on `packages/webhook`, `packages/sdk` and `packages/server` passes.

## Departures from the plan

- Each task file lists its departures under its Resume section.
- Task 05 came from the review of 2026-10-15: a callback follows no redirect, and a refused turn answers 409.
- The plan closed after host/92, because a thread's chat was lost after a restart until then.

## Left for later

- See [deferred.md](deferred.md).
