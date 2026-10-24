---
title: agent-acp registers a kind
status: todo
depends: [task-01-the-agents-channel.md]
layer: "agent-acp"
refs:
  - "[code://packages/agent-acp/src/plugin.ts#L135-L165](../../../../packages/agent-acp/src/plugin.ts#L135-L165) - the `presets` option and the per-preset fields"
  - "[code://packages/agent-acp/src/plugin.ts#L378](../../../../packages/agent-acp/src/plugin.ts#L378) - where each preset registers an agent"
  - "[code://packages/agent-acp/src/presets.ts](../../../../packages/agent-acp/src/presets.ts) - the shipped rows, which become templates"
---

## Objective

agent-acp registers the kind `acp`, and each record of it is one agent. Each shipped row, such as `codex`, is a template that a new record starts from.

## Files

- `UPDATE: packages/agent-acp/src/plugin.ts:135-378` - register the kind, and remove `presets` from the options.
- `UPDATE: packages/agent-acp/src/presets.ts` - give each shipped row as a template.
- `UPDATE: packages/agent-acp/src/session.ts` - read the live record at the start of each turn, and start the child again when it changed.
- `CREATE: packages/agent-acp/test/kind.test.ts` - the kind tests.

## Steps

1. Register the kind `acp` with `registerAgentKind`, and stop calling `registerAgent` for each preset.
2. Make the schema the fields in `PER_PRESET`, without `displayName`, `description` and `model`.
3. Give each row of `presets.ts` as a template, with its vendor key variables as fields.
4. List `command`, `args`, `cwd`, `machine` and `install` in `hostOnly`.
5. List each row's vendor key variables in `keyVariables`.
6. Keep `hostTools` and the other options for the whole plugin as defaults that a record may override.
7. At the start of a turn, start the child again on the same session when the record changed.

## Validation

- A test in `packages/agent-acp/test/` opens two records and expects two agents with their own settings.
- A test edits a record and expects the next turn to use the change.
- The gate passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a status, error or log must never carry a key or a secret value.
