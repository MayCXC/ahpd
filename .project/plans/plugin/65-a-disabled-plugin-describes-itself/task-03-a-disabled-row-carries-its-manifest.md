---
title: A disabled row carries its manifest
status: todo
depends: [task-02-a-standalone-plugin-has-a-manifest.md]
layer: "server"
refs:
  - "[code://packages/server/src/plugins.ts#L1660-L1700](../../../../packages/server/src/plugins.ts#L1660-L1700) - `describePlugin`, which returns at once for a disabled spec"
  - "[code://packages/server/src/pluginschannel.ts#L170-L200](../../../../packages/server/src/pluginschannel.ts#L170-L200) - the row, which takes a manifest only from the loaded copy"
  - "[code://packages/server/test/plugins-channel.test.ts](../../../../packages/server/test/plugins-channel.test.ts) - the channel row tests"
---

## Objective

A disabled plugin's row holds its title, version and manifest, which the daemon reads with no import.
An enabled plugin that failed to load holds them too.

## Files

- `UPDATE: packages/server/src/plugins.ts:1660-1700` - resolve and read the manifest of a disabled spec, and keep its state `disabled`.
- `UPDATE: packages/server/src/pluginschannel.ts:170-200` - send the described manifest when no loaded copy exists.
- `UPDATE: packages/server/test/plugins-channel.test.ts` - the cases below.
- `UPDATE: packages/server/test/plugin-list.test.ts` - a disabled row in `ahpd plugin list`.

## Steps

1. Remove the early return for a disabled spec in `describePlugin`.
2. Set the state of a disabled spec to `disabled` after you read the manifest.
3. Keep `missing` for a disabled spec that does not resolve.
4. Make the channel row take the loaded copy's manifest first, and else the manifest from `describePlugin`.
5. Check that no row imports a disabled plugin's module.
6. Run `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`, then restore `packages/sdk/test/fixtures/wire.jsonl`.

## Validation

- A test lists a disabled package plugin, and its row holds the title, version, description and contracts of its package.json.
- A test lists a disabled standalone plugin, and its row holds its `plugin.json` manifest.
- A test lists a disabled plugin whose module throws on import, and the row has the manifest and no problem.
- A test lists an enabled plugin that failed to load, and its row holds its manifest and its problem.

## Resume
