---
title: agent-claude registers a kind
status: done
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

- **Done so far:** the plugin registers the kind `claude` beside the preset agents, and a record of it opens one backend whose values are read again at the start of every turn. In `plugin.ts`, `apply` now calls `host.registerAgentKind(kindOf(paths, shared))` and still folds one agent per preset; the load-time options are gathered by a new `defaultsOf(host, values)`, which `optionsOf` also uses, so the plugin's own options (`paths`, the computer options, `workerStop`, `handshakeTimeoutMs`) are defaults the kind and every preset share and none of them is in the kind's schema. `kindOf` builds the kind: title, description, `schema: kindSchema()`, one template (`Claude Code`, no field set), `hostOnly: ['extraArgs']`, `keyVariables: ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN']`, and `open` returning `claude({...shared, paths, provider: record.id, displayName: record.name, presetOf: () => ({ ...record.config })})` with `models` and `keepCliModels` split out of the config because they are agent fields rather than query options. In `options.ts`, `kindSchema()` is the per-preset declaration minus `name`, `description`, `icon` and `model`, plus `models` and `keepCliModels`. In `claude.ts`/`session/context.ts`, `ClaudeOptions` and `ClaudeSessionOptions` gained `presetOf?: () => Bag`, the live read; `create` passes it through and `endpoints` probes with it. In `session.ts`, `live()` and `valuesOf(preset)` build the values (defaults, preset, stored sandbox) and `ctx` gained `valuesOf`/`startedWith`. In `session/query.ts`, the builder is now `buildQuery(agent, first)` behind `startQuery`, which records `ctx.startedWith = JSON.stringify(ctx.values)`; `fromPreset()` replaces the captured `queryOptionsOf(ctx.values)` at each use; `refreshPreset()` compares the live values with `startedWith`, closes the CLI and starts a new query with `first: false` (a resume of `ctx.agentId`), returning a sentence when the CLI will not stop. In `session/turns.ts`, `beginTurn` calls `ctx.refreshPreset() ?? ctx.switchAgent(...)` inside the `beginning` window, so the edit lands on the turn after it and the running turn keeps its CLI. The manifest declares `contracts.agentKinds: ["claude"]` and keeps `presets` in `options`. New test `packages/agent-claude/test/kind.test.ts` (3 cases): the kind's shape, hostOnly, key variables, schema fields and the preset agents beside it; two records opening two backends with their own ids, names and query options; an edit applied at the next turn by a second `query()` resumed on the conversation id the first CLI gave.
- **Next action:** task 04 (agent-acp registers a kind).
- **Files:**
  - `packages/agent-claude/src/plugin.ts`
  - `packages/agent-claude/src/options.ts`
  - `packages/agent-claude/src/claude.ts`
  - `packages/agent-claude/src/session.ts`
  - `packages/agent-claude/src/session/context.ts`
  - `packages/agent-claude/src/session/query.ts`
  - `packages/agent-claude/src/session/turns.ts`
  - `packages/agent-claude/package.json`
  - `packages/agent-claude/test/kind.test.ts` (new)
- **Open questions:** none. The Answers table settles the one this task raised: `env` is not host-only, because a variable named in `keyVariables` is a key any owner may set and every other variable is host-only by the channel's rule.
- **Departures:** (1) `presets` is still in the options and still registers an agent each, because the instruction for this branch is to keep the presets working until task 07 migrates them; the kind and the presets coexist because the fold refuses a record id a plugin already serves, so no id is two agents. (2) Step 4 lists `extraArgs` and `env` in `hostOnly`; only `extraArgs` is there. Listing `env` would refuse every owner but the host the variables the kind names in `keyVariables`, and the Answers table makes `keyVariables` the rule for what a person or a team may set and the channel's own `refuseEnv` the rule for the rest. (3) Step 1's "stop calling `registerAgent` for each preset" is likewise deferred to task 07. (4) The record's values are compared by `JSON.stringify`, which is enough because a record's config is JSON by construction; a key whose value a person reorders reads as an edit and buys one restart with the same values.
- **Watch out for:** a status, error or log must never carry a key or a secret value. The `presetOf` bag comes from the channel's live view, so a key variable arrives as its vault value, and it is only ever handed to `query()`; nothing here logs `ctx.values`. `refreshPreset`'s refusal sentence carries the CLI's own error text, which is about the process, not the config.

