---
title: An adapter falls back to its plugin's icon
status: todo
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
