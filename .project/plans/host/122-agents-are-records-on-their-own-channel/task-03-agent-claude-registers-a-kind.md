---
title: agent-claude registers a kind
status: todo
depends: [task-01-the-agents-channel.md]
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/plugin.ts#L63-L117](../../../../packages/agent-claude/src/plugin.ts#L63-L117) - the `presets` option and `variantsOf`"
  - "[code://packages/agent-claude/src/plugin.ts#L204](../../../../packages/agent-claude/src/plugin.ts#L204) - where each preset registers an agent"
  - "[code://packages/agent-claude/src/options.ts](../../../../packages/agent-claude/src/options.ts) - `presetSchema` and the per-preset fields"
---

## Objective

agent-claude registers the kind `claude`, and each record of it is one agent. The template `claude` is the built-in agent, and a turn after an edit restarts the CLI and resumes the session.

## Files

- `UPDATE: packages/agent-claude/src/plugin.ts:63-204` - register the kind, and remove `presets` from the options.
- `UPDATE: packages/agent-claude/src/options.ts` - make `presetSchema` the kind's schema, without the four fields the channel owns.
- `UPDATE: packages/agent-claude/src/session.ts` - read the live record at the start of each turn, and restart the CLI when it changed.
- `CREATE: packages/agent-claude/test/kind.test.ts` - the kind tests.

## Steps

1. Register the kind `claude` with `registerAgentKind`, and stop calling `registerAgent` for each preset.
2. Make the schema the per-preset fields, without `name`, `description`, `icon` and `model`.
3. Add the template `claude`, which is the built-in agent with no field set.
4. List `extraArgs` and `env` in `hostOnly`.
5. List the key variables the CLI reads, such as `ANTHROPIC_API_KEY`, in `keyVariables`.
6. Keep `paths` and the other options for the whole plugin as defaults that a record may override.
7. At the start of a turn, compare the live record with the one the CLI started with.
8. When it changed, end the CLI and start it again with `--resume` on the same session.

## Validation

- A test in `packages/agent-claude/test/` opens two records and expects two agents with their own settings.
- A test edits a record and expects the next turn to use the change.
- The gate passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a status, error or log must never carry a key or a secret value.
