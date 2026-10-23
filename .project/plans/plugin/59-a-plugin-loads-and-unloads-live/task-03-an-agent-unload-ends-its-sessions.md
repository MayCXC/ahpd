---
title: An agent unload ends its sessions
status: todo
depends: [task-02-a-plugin-change-applies-at-once.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/host.ts#L156-L203](../../../../packages/sdk/src/host.ts#L156-L203) - the agent map"
  - "[code://packages/server/src/plugins.ts#L1156](../../../../packages/server/src/plugins.ts#L1156) - the loader, where `unloadOne` runs"
---

## Objective

An unload of a plugin with an agent ends each session that runs on that agent, then removes the agent.

## Files

- `UPDATE: packages/sdk/src/host.ts` - add a way to end every session on one agent, as a disposal does.
- `UPDATE: packages/server/src/applyplugins.ts` - end the agent's sessions before `unloadOne`.
- `UPDATE: packages/server/test/plugin-live.test.ts` - the agent cases.
- `UPDATE: docs/plugins/PLUGINS.md` - say that disabling an agent plugin ends its sessions.

## Steps

1. Read how the host disposes of one session, and reuse that path.
2. Add `host.endSessionsOf(agent)`, which ends each session whose provider is that agent.
3. Call it in `applyPlugins` for each agent of a plugin that unloads.
4. Call it for a reload with new options too, before the closers run.
5. Write the docs line.

## Validation

- `plugin-live.test.ts` opens a session on a plugin agent, disables the plugin, and the session ends.
- The agent is gone from the root state after the unload.
- `npm test -w packages/server` passes.

## Resume

