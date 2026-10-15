---
title: ahpd's plugins export slugs
status: todo
depends: []
layer: "plugin packages, docs"
refs:
  - "[code://packages/webhook/src/route.ts#L8-L11](../../../../packages/webhook/src/route.ts#L8-L11) - `NAME` and `PREFIX`"
  - "[code://packages/bot/src/plugin.ts#L27](../../../../packages/bot/src/plugin.ts#L27) - one of the nine `name` exports"
  - "[code://docs/WEBHOOKS.md](../../../../docs/WEBHOOKS.md) - the route URLs and the principal"
  - "[code://docs/DAEMON.md](../../../../docs/DAEMON.md) - the verb and `--plugin-option` examples"
  - "[code://docs/PLUGINS.md](../../../../docs/PLUGINS.md) - the contract example and the section on the id"
---

## Objective

Each first-party plugin exports its package name without the `@ahpd/` scope as its `name`.
The webhook is served under `/plugins/webhook/` and acts as `plugin:webhook`.
The docs name each plugin by its new id.

## Files

- `CREATE: packages/server/test/plugin-ids.test.ts` - imports each first-party plugin module and checks that its `name` is the slug.
- `UPDATE: packages/agent-acp/src/plugin.ts:24` - `name` is `agent-acp`.
- `UPDATE: packages/agent-claude/src/plugin.ts:23` - `name` is `agent-claude`.
- `UPDATE: packages/agent-cofold/src/plugin.ts:25` - `name` is `agent-cofold`.
- `UPDATE: packages/agent-pi/src/plugin.ts:20` - `name` is `agent-pi`.
- `UPDATE: packages/bot/src/plugin.ts:27` - `name` is `bot`.
- `UPDATE: packages/computer/src/plugin.ts:42` - `name` is `computer`.
- `UPDATE: packages/push/src/plugin.ts:28` - `name` is `push`.
- `UPDATE: packages/tunnel-devtunnel/src/plugin.ts:28` - `name` is `tunnel-devtunnel`.
- `UPDATE: packages/webhook/src/route.ts:8-11` - `NAME` is `webhook`, and the comments name `/plugins/webhook/`.
- `UPDATE: packages/webhook/src/plugin.ts:12` - the comment names `/plugins/webhook/<endpoint>`.
- `UPDATE: packages/webhook/README.md:34` - the endpoint path.
- `UPDATE: packages/webhook/test/webhook-route.test.ts:16` - the prefix is `/plugins/webhook`.
- `UPDATE: packages/webhook/test/webhook-bot.test.ts:17` - the URL is under `/plugins/webhook/`.
- `UPDATE: packages/webhook/test/webhook-automation.test.ts:13` - the URL is under `/plugins/webhook/`.
- `UPDATE: packages/server/test/webhook-bot.test.ts:130-180` - the route key is `webhook`, and the URLs are under `/plugins/webhook/`.
- `UPDATE: packages/server/test/server-root-config.test.ts:481` - the key is `plugins.agent-claude`.
- `UPDATE: docs/WEBHOOKS.md:32-107` - the route URLs and the principal `plugin:webhook`.
- `UPDATE: docs/DAEMON.md:473-510` - the verb and `--plugin-option` examples name the id.
- `UPDATE: docs/PLUGINS.md:24-72` - the contract example exports a slug, and the id section names the first-party ids.

## Steps

1. Write `plugin-ids.test.ts`, which imports the nine `plugin.ts` modules and expects each `name` to be its slug.
2. Change the webhook tests to the `/plugins/webhook/` URLs, and the root config test to `plugins.agent-claude`.
3. Run the tests and see them fail.
4. Change each `name` export and the webhook's `NAME` to the slug.
5. Run the package tests, and change each test that asserts an `@ahpd/<x>` id to the slug.
6. Keep each spec written as `@ahpd/<x>` in a test, because it is a package name.
7. Change the webhook comments and `packages/webhook/README.md` to the new path.
8. Change `docs/WEBHOOKS.md` to `/plugins/webhook/` and `plugin:webhook`.
9. Change the `docs/DAEMON.md` examples of a verb and of `--plugin-option` to the id.
10. Change the `docs/PLUGINS.md` contract example and the id section to a slug id.
11. Run the gates.

## Validation

- `plugin-ids.test.ts` holds one case for each of the nine plugins.
- The webhook route tests pass under `/plugins/webhook/`.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude packages/agent-acp packages/bot packages/webhook packages/computer packages/push` passes.
- `rg -n "%40ahpd|plugin:@ahpd" docs packages/webhook` finds nothing.

## Resume

