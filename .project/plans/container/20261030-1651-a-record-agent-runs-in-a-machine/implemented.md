---
title: A record agent runs in a machine - implemented
date: 2026-10-30
refs:
  - "[code://packages/sdk/src/agents/channel.ts#L369](../../../../packages/sdk/src/agents/channel.ts#L369) - `handed`, the plugin and the two copies of a record"
  - "[code://packages/sdk/src/sessions/nested.ts#L966](../../../../packages/sdk/src/sessions/nested.ts#L966) - the proxy asks for them when no plugin registered the agent"
  - "[code://packages/server/src/agents/handed.ts](../../../../packages/server/src/agents/handed.ts) - the host inside opens the record it was handed"
---

A cofold or pi agent made from a record runs in a machine again.
The host inside is started with the plugin of the record's engine, and serves the record it is handed in `AHPD_AGENT_RECORD`.

## What was built

- [`code://packages/sdk/src/types/computers.ts`](../../../../packages/sdk/src/types/computers.ts) - `AGENT_RECORD_VARIABLE`, `HandedRecord` with a `whole` and a `bare` copy, `HandedAgent`, and `NestedStart.record`.
- [`code://packages/sdk/src/plugins/plugins.ts`](../../../../packages/sdk/src/plugins/plugins.ts) - a served engine keeps the spec of the plugin that registered it.
- [`code://packages/sdk/src/channels/owners.ts`](../../../../packages/sdk/src/channels/owners.ts) - `withoutSecrets`, a config with every secret field removed.
- [`code://packages/sdk/src/agents/channel.ts`](../../../../packages/sdk/src/agents/channel.ts) - `handed(id)`: the engine's plugin, the record with its vault values, and the record without them.
- [`code://packages/sdk/src/types/host.ts`](../../../../packages/sdk/src/types/host.ts) - the `handedAgent` host option, which the daemon answers from the agents channel.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) and [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - a nested session and a nested delete ask for it when `agentPlugins` names no plugin.
- [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts) - `nestedHost` puts the whole copy in the env of a machine on this host. A machine off this host gets the bare copy in its remote command.
- [`code://packages/sdk/src/nodes.ts`](../../../../packages/sdk/src/nodes.ts) - a dialled node gets the bare copy in the `env` of `node/open`.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - the host reads the variable at start, folds the agent in beside the records, and removes the variable from its env.
- [`code://docs/plugins/COMPUTERS.md`](../../../../docs/plugins/COMPUTERS.md) - a paragraph on the record and `AHPD_AGENT_RECORD`.

## Verified

- `packages/sdk/test/nested-proxy.test.ts`: 54 pass. A record agent asks the port for `@ahpd/agent-cofold` and its record. A plugin's agent asks for its plugin, no record, and never calls `handedAgent`. An agent that neither serves ends with "does not know which plugin serves".
- `packages/computer/test/computer-needs.test.ts`: a machine on this host gets `-e AHPD_AGENT_RECORD`, the whole record in the env, and no key in an argument.
- `packages/computer/test/computer-ssh.test.ts`: an ssh box gets the record without `apiKey` in the remote command.
- `packages/server/test/agent-handed.test.ts`: a stdio host lists the handed id in its root and writes nothing of the record to disk. A record of an unloaded engine is refused with a line that names the engine.
- `pnpm typecheck` passes.

## Departures from the plan

- Task 01 steps 1 and 2 - the fold does not put a record agent in `agentPlugins`. The agents channel answers the plugin and the record together through `handedAgent`, because it already holds the opened record and its engine.
- Task 02 step 3 - `join.ts` is unchanged. It already starts its host inside with the `env` that `node/open` sends, so `nodes.ts` sets the variable there.

## Left for later

- The two runs by hand in the checklist: a cofold record session on a disposable machine on this host, and the same on dev02. Container 05 p8 task 05 runs the dev02 one.
