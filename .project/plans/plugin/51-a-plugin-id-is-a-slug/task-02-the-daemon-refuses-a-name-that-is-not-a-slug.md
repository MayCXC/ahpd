---
title: The daemon refuses a plugin whose name is not a slug
status: todo
depends: [task-01-ahpds-plugins-export-slugs.md]
layer: "server"
refs:
  - "[code://packages/server/src/plugins.ts#L712-L726](../../../../packages/server/src/plugins.ts#L712-L726) - `namePlugin`, which reads the module's `name`"
  - "[code://packages/server/src/plugins.ts#L760-L790](../../../../packages/server/src/plugins.ts#L760-L790) - `loadOne`, where a plugin is skipped with a problem line"
  - "[code://packages/sdk/src/records.ts#L276-L284](../../../../packages/sdk/src/records.ts#L276-L284) - `RECORD_SLUG` and `isRecordSlug`"
  - "[code://packages/server/test/fixtures/plugin-route/index.ts](../../../../packages/server/test/fixtures/plugin-route/index.ts) - a fixture that exports `@ahpd/plugin-route`"
---

## Objective

`loadOne` skips a plugin whose module exports a `name` that is not a slug, and reports one problem line.
The line is `plugin <name> skipped: its name is not a slug: <RECORD_SLUG>`.
A provisional id is not checked.

## Files

- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below.
- `UPDATE: packages/server/src/plugins.ts:760-790` - the slug check after the shape check in `loadOne`.
- `UPDATE: packages/server/test/fixtures/plugin-route/index.ts:8-16` - the fixture exports `plugin-route`.
- `UPDATE: packages/server/test/plugin-route.test.ts:32-217` - the prefix is `/plugins/plugin-route`.
- `UPDATE: packages/sdk/src/types/plugin.ts:863` - `Plugin.name` says that the id is a slug.
- `UPDATE: docs/PLUGINS.md:39-47` - the id section says that a `name` that is not a slug is refused.

## Steps

1. Add a case to `plugin-load.test.ts`: the loader skips a module that exports `name = '@acme/x'`, and the problem names the slug rule.
2. Add a case: a module with no `name` export, in a folder whose manifest `name` is `@acme/y`, loads under `@acme/y`.
3. Run the tests and see the first case fail.
4. In `loadOne`, read the module's `name` after `checkShape`.
5. When `name` is a non-empty string and `isRecordSlug` refuses it, return the problem line and do not call `apply`.
6. Change the route fixture to `plugin-route`, and its test to `/plugins/plugin-route`.
7. Change the doc comment of `Plugin.name` and the id section of `docs/PLUGINS.md`.
8. Run the gates.

## Validation

- `plugin-load.test.ts` holds the two cases above.
- `plugin-route.test.ts` passes under `/plugins/plugin-route/`.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude packages/agent-acp packages/bot packages/webhook packages/computer packages/push` passes.

## Resume

