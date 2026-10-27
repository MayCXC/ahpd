---
title: An adapter falls back to its plugin's icon
status: implemented
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/connectors/adapters.ts#L51-L60](../../../../packages/sdk/src/connectors/adapters.ts#L51-L60) - `rowOf`, which sends no `icons` for an adapter with none"
  - "[code://packages/sdk/src/agents/engines.ts#L56-L66](../../../../packages/sdk/src/agents/engines.ts#L56-L66) - the pattern to copy: `pluginIcons` for an engine with none"
---

## Objective

An adapter with no icons is sent with the icons of the plugin that registered it.
An adapter whose plugin has no icon is sent with none, and the client draws its blank square.

## Files

- `UPDATE: packages/sdk/src/connectors/adapters.ts:51-60` - take a `pluginIcons` option, and send the plugin's icons for an adapter with none.
- `UPDATE: packages/server/src/commands/run.ts:765` - give the adapters channel the `pluginIcons` the engines channel gets at line 801.
- `UPDATE: packages/sdk/test/adapters-channel.test.ts` - cases for an adapter with its own icon, one with none, and one whose plugin has none.

## Steps

1. Add `pluginIcons?(name: string): Icon[] | undefined` to the adapters channel options, as the engines channel has it.
2. In `rowOf`, send the adapter's icons, else the icons of the plugin named by the adapter's `by`.
3. Pass the host's `pluginIcons` to the adapters channel where the engines channel gets it.
4. Add the three test cases.

## Validation

- The adapters channel tests pass, with the new cases.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.

## Resume

- **Done so far:** `AdaptersChannelOptions` in `packages/sdk/src/connectors/adapters.ts` takes an optional `pluginIcons(name)`, and `rowOf` sends an adapter's own icons, else the icons its plugin registered, and leaves the key out when there are none. `packages/server/src/commands/run.ts` gives the adapters channel the same `pluginIcons` the engines channel has, read from the loaded plugin's manifest. `adapters-channel.test.ts` has two new cases: an adapter with no icon takes its plugin's, and one whose plugin has none carries no `icons` key.
- **Next action:** none; task 03 builds on task 01, not this one.
- **Files:** `packages/sdk/src/connectors/adapters.ts`, `packages/server/src/commands/run.ts`, `packages/sdk/test/adapters-channel.test.ts`, this task file.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** an adapter's own icon wins over its plugin's, and an empty list on the adapter is treated as none.
