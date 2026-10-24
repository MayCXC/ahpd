---
title: agent-cofold registers a kind
status: todo
depends: [task-01-the-agents-channel.md]
layer: "agent-cofold"
refs:
  - "[code://packages/agent-cofold/src/plugin.ts#L56](../../../../packages/agent-cofold/src/plugin.ts#L56) - the `provider` option, which becomes the record id"
  - "[code://packages/agent-cofold/src/plugin.ts#L131](../../../../packages/agent-cofold/src/plugin.ts#L131) - where the one agent registers"
---

## Objective

agent-cofold registers the kind `cofold`, and each record of it is one agent. A daemon may have more than one cofold agent.

## Files

- `UPDATE: packages/agent-cofold/src/plugin.ts:56-131` - register the kind, and remove `provider` and the per-agent fields from the options.
- `UPDATE: packages/agent-cofold/src/agent.ts` - make an agent from one record, and read the live record at the start of each turn.
- `CREATE: packages/agent-cofold/test/kind.test.ts` - the kind tests.

## Steps

1. Register the kind `cofold` with `registerAgentKind`, and stop calling `registerAgent`.
2. Make the schema the per-agent options, such as `baseUrl` and `apiKey`, without the four fields the channel owns.
3. Mark `apiKey` `writeOnly`.
4. Add the template `cofold`, which reads `~/.config/cofold/config.json` with no field set.
5. Keep `store` and the other options for the whole plugin as defaults that a record may override.
6. Read the live record at the start of each turn, so a changed key or model applies at that turn.

## Validation

- A test in `packages/agent-cofold/test/` opens two records and expects two agents with their own settings.
- A test edits a record and expects the next turn to use the change.
- The gate passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a status, error or log must never carry a key or a secret value.
