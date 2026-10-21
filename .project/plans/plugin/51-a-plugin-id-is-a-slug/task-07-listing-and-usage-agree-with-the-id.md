---
title: The listing and usage reads agree with the id
status: done
depends: [task-03-an-old-owner-name-reads-as-the-new-one.md, task-05-a-fallback-id-is-a-slug-too.md]
layer: "sdk, server"
refs:
  - "[code://packages/server/src/plugins.ts#L1231-L1292](../../../../packages/server/src/plugins.ts#L1231-L1292) - `describePlugin`, the row `ahpd plugin list` shows"
  - "[code://packages/sdk/src/usage/usage.ts#L544-L556](../../../../packages/sdk/src/usage/usage.ts#L544-L556) - `split`, the pool a `usage:` URI names"
  - "[code://packages/sdk/src/usage/usage.ts#L906-L910](../../../../packages/sdk/src/usage/usage.ts#L906-L910) - `poolParam`, the pool a usage command names"
  - "[code://packages/sdk/src/usage/usage.ts#L933-L944](../../../../packages/sdk/src/usage/usage.ts#L933-L944) - `onePool`, the gate of a usage command over one pool"
  - "[code://packages/sdk/src/plugins/plugins.ts#L138-L139](../../../../packages/sdk/src/plugins/plugins.ts#L138-L139) - `routePrefix`"
---

## Objective

`ahpd plugin list` does not say `ready` for a plugin that a load skips because its id is not a slug.
The listing shows that plugin as `error`, with the problem `its name is not a slug`, like a manifest that does not hold.
A usage read by pool name reads the name through `currentOwner`, so a read of `plugin:@ahpd/bot` answers the lines saved under `plugin:bot`.
`routePrefix` keeps its encoding as a guard, and the plan's answer row says so.

## Files

- `UPDATE: packages/server/test/plugin-list.test.ts` - the listing cases below.
- `UPDATE: packages/sdk/test/usage-scheme.test.ts` - a read of `usage://plugin%3A%40ahpd%2Fbot` and its leaves.
- `UPDATE: packages/sdk/test/usage-methods.test.ts` - `totals`, `range` and `records` with the pool `plugin:@ahpd/bot`.
- `UPDATE: packages/server/src/plugins.ts:1252-1279` - `describePlugin` checks the id after the range check, and on the path with no manifest.
- `UPDATE: packages/sdk/src/usage/usage.ts` - `split`, `poolParam` and the `authorize` of `onePool` read the pool through `currentOwner`.
- `UPDATE: docs/plugins/PLUGINS.md` - the `error` state names an id that is not a slug.
- `UPDATE: plan.md` - the `routePrefix` row, and the answer rows of this task.

## Steps

1. Add a listing case for each of three ids that are not slugs. Each lists as `error`. The ids come from a file `My_Plugin.js`, a module that exports `@acme/x`, and a long manifest name. A manifest `@acme/y` lists as `ready` with the id `acme-y`.
2. Add usage cases: the old pool name reads the same as the new one, by URI and by command.
3. Run the tests and see them fail.
4. In `describePlugin`, turn a row whose id is not a slug into `error`. Check the id where `loadOne` checks it: after the manifest and the range, before the options.
5. In `usage.ts`, read the pool through `currentOwner` where a URI or a command names it.
6. Change the docs and the plan, then run the gates.

## Validation

- `plugin-list.test.ts`, `usage-scheme.test.ts` and `usage-methods.test.ts` hold the cases above.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude packages/agent-acp packages/bot packages/webhook packages/computer packages/push` passes.

## Resume

- **Done:** 2026-10-14. The listing shows an id that is not a slug as `error`. Usage reads by an old pool name answer the lines of the new one.
- **Order:** a disabled or missing spec keeps its state, because a load does not reach the slug check for either. An incompatible or bad manifest keeps its state too, because a load refuses it first.
- **Reply:** a read of `usage://plugin%3A%40ahpd%2Fbot` answers `pool: "plugin:bot"`, the id, and not the name the reader gave.
- **Gates:** typecheck, boundary and schema pass. The test gate passes with 5105 tests, and agent-cofold, agent-pi and tunnel-devtunnel pass with 444 tests.
