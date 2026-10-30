---
title: The host names a record agent's plugin and record
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/plugins/plugins.ts#L437](../../../../packages/sdk/src/plugins/plugins.ts#L437) - the spec a plugin's own agent is kept with"
  - "[code://packages/sdk/src/plugins/plugins.ts#L545-L584](../../../../packages/sdk/src/plugins/plugins.ts#L545-L584) - the engines and the record agents of a fold"
  - "[code://packages/sdk/src/agents/channel.ts#L345-L355](../../../../packages/sdk/src/agents/channel.ts#L345-L355) - `opened`, the record with its secrets read"
  - "[code://packages/sdk/src/host/spawn.ts#L794-L811](../../../../packages/sdk/src/host/spawn.ts#L794-L811) - where a nested session gets its plugins"
  - "[code://packages/sdk/src/host/lifecycle.ts#L527](../../../../packages/sdk/src/host/lifecycle.ts#L527) - where a nested delete gets its plugin"
---

## Objective

A record agent has the spec of its engine's plugin in `agentPlugins`.
A nested session of it hands the host inside that plugin and the opened record.

## Files

- `UPDATE: packages/sdk/src/plugins/plugins.ts:545-584` - keep the spec of the plugin that registered each engine, and put it in `agentPlugins` for each record agent of that engine.
- `UPDATE: packages/sdk/src/agents/channel.ts:345-355` - give the fold the engine of each opened record, and answer the opened record of an id.
- `UPDATE: packages/sdk/src/sessions/nested.ts:112-121` - `NestedAsked.record`, the record the host inside serves.
- `UPDATE: packages/sdk/src/host/spawn.ts:794-811` - pass the record to `nestedAgent` and to `connect`.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:527` - pass the record to a nested delete.
- `UPDATE: packages/sdk/test/nested-proxy.test.ts` - the cases below.

## Steps

1. Keep the spec of the plugin that registered each engine in the fold, as `contribution.spec ?? contribution.by`.
2. Put that spec in `agentPlugins` under the id of each record agent the engine opened.
3. Read the opened record of an id from the agents channel, with its secret fields as the vault answered them.
4. Add `record` to `NestedAsked` and pass it from `spawn.ts` and `lifecycle.ts` with the plugin.
5. Pass nothing new for an agent a plugin registered.

## Validation

- `packages/sdk/test/nested-proxy.test.ts`: a cofold record agent on a machine asks the port for `@ahpd/agent-cofold` and its record.
- The same case fails before the change with "does not know which plugin serves".
- `packages/sdk/test/nested-proxy.test.ts`: a plugin's own agent asks for its plugin and no record.
- `node_modules/.bin/vitest run packages/sdk/test/nested-proxy.test.ts` passes.
- `pnpm typecheck` passes.

## Resume
