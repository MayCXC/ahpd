---
title: The bot plugin serves its catalogue
status: todo
depends: [task-01-the-host-says-when-memberships-change.md, task-03-a-plugin-publishes-to-some-subscribers.md]
layer: "packages/bot"
refs:
  - "[code://packages/bot/src/provider.ts#L184-L191](../../../../packages/bot/src/provider.ts#L184-L191) - `mayRead`"
  - "[code://packages/bot/src/provider.ts#L429](../../../../packages/bot/src/provider.ts#L429) - `store.put`, where a make or an edit ends"
  - "[code://packages/bot/src/provider.ts#L453](../../../../packages/bot/src/provider.ts#L453) - `store.remove`, where a delete ends"
---

## Objective

The bot plugin serves `x-ahpd-bots://`.
A subscriber gets the bots it may read, then `added`, `changed` and `removed` as bots and memberships change.

## Files

- `CREATE: packages/bot/src/catalogue.ts` - the channel: snapshot, the set sent to each client, publish on a change, and the diff on `users_changed`.
- `UPDATE: packages/bot/src/provider.ts:429` - a make or an edit tells the catalogue.
- `UPDATE: packages/bot/src/provider.ts:453` - a delete tells the catalogue.
- `UPDATE: packages/bot/src/index.ts` - the plugin registers the channel and listens to `users_changed`.
- `CREATE: packages/bot/test/bot-catalogue.test.ts` - two readers, a make, an edit, a delete, and a membership change.

## Steps

1. Register `x-ahpd-bots://` with the grant `bot:read` and an `authorize` that lets in a reader who may read one bot.
2. Answer a snapshot `{ bots: [...] }` with each record `mayRead` lets the reader read.
3. Keep the slugs sent to each client, and forget them in `left(client)`.
4. On a make, publish `x-ahpd-bots/added` with the record and `visible` set to `mayRead`.
5. On an edit, publish `x-ahpd-bots/changed`, and send `added` or `removed` where readability changed.
6. On a delete, publish `x-ahpd-bots/removed` to each client whose set held the slug.
7. On `users_changed`, compute each client's set again and publish the difference with `to`.
8. Write the tests.

## Validation

1. Run `pnpm exec vitest run packages/bot`.
2. Run `pnpm exec vitest run packages/server`.
3. Run `pnpm -s typecheck` and `pnpm -s boundary`.
