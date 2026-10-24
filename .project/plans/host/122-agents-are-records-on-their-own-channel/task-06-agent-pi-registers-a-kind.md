---
title: agent-pi registers a kind
status: todo
depends: [task-01-the-agents-channel.md]
layer: "agent-pi"
refs:
  - "[code://packages/agent-pi/src/plugin.ts#L33-L77](../../../../packages/agent-pi/src/plugin.ts#L33-L77) - the `provider` option and where the one agent registers"
  - "[code://packages/agent-pi/src/machine.ts#L25](../../../../packages/agent-pi/src/machine.ts#L25) - `PI_KEY_VARIABLES`, the kind's key variables"
---

## Objective

agent-pi registers the kind `pi`, and each record of it is one agent. A team or a person can give their own key through a variable in `PI_KEY_VARIABLES`.

## Files

- `UPDATE: packages/agent-pi/src/plugin.ts:33-77` - register the kind, and remove `provider` and the per-agent fields from the options.
- `UPDATE: packages/agent-pi/src/agent.ts` - make an agent from one record, and read the live record at the start of each turn.
- `CREATE: packages/agent-pi/test/kind.test.ts` - the kind tests.

## Steps

1. Register the kind `pi` with `registerAgentKind`, and stop calling `registerAgent`.
2. Make the schema the per-agent options, without the four fields the channel owns.
3. Add an `env` field with one `writeOnly` property per name in `PI_KEY_VARIABLES`.
4. Set `keyVariables` to `PI_KEY_VARIABLES`.
5. List the fields that run a program or choose a machine in `hostOnly`.
6. Add the template `pi`, with no field set.
7. Read the live record at the start of each turn, so a changed key or model applies at that turn.

## Validation

- A test in `packages/agent-pi/test/` opens two records and expects two agents with their own settings.
- A test edits a record and expects the next turn to use the change.
- The gate passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a status, error or log must never carry a key or a secret value.
