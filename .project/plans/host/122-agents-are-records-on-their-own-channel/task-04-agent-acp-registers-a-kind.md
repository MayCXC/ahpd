---
title: agent-acp registers a kind
status: implemented
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

- **Done so far:** the plugin registers the kind `acp` beside the preset agents, and a record of it opens one backend whose values are read again at the start of every turn, with another server spawned on the same conversation when they changed. In `plugin.ts`, `apply` now calls `host.registerAgentKind(kindOf(host, options))` and still folds one agent per preset; the options a load shares with every agent are gathered by a new `defaultsOf(host, values)` (`log`, `hostTools`, `toolsChanged`, from a new `Shared` interface), which `presetOf` takes instead of the raw values. `kindSchema()` is the per-preset declaration less `base`, `name`, `description` and `model`. `optionsOfRecord(shared, record)` builds one record's `AcpOptions` from the live view: the command is required and its absence is a sentence naming the record, the id is the provider, the record's name/description/model are the channel-owned fields, `args`/`cwd`/`authenticate`/`honoursTrust` are read as their schema declares, `env` drops empty values (a template's key fields) and keeps the vault's, `hostTools`/`toolsChanged` fall back to the plugin's, and `machine` goes through the existing `machineOf`. `kindOf` sets title, description, `templates: templates()`, `hostOnly: ['command','args','cwd','machine','install']`, `keyVariables: KEY_VARIABLES`, and `open` returning `acpAgent({...optionsOfRecord(...), presetOf: () => optionsOfRecord(...)})`. In `presets.ts`, `keyVariablesOf(id)` is a row's secret `knownAgents` variables plus its `authenticate.fromEnv`, `KEY_VARIABLES` is their sorted union (13 names), and `templates()` gives one template per shipped row: the row's command, args, env switches, sign-in method, trust and machine, the known agent's install line and page, and its key variables set empty. `AcpOptions` gained `presetOf?: () => AcpOptions`. In `session/opening.ts`, `refreshOptions()` re-reads the record, adopts every live field onto the shared options object in place (so the spawn, the sign-in, the trust rule and the agent's `defaults()` all see it), compares the spawn fields (`SPAWN_KEYS`) against `ctx.startedWith`, and on a change clears `ctx.live`/`ctx.opening` and closes the old connection without awaiting it, leaving `acpSessionId` so `open` reopens the conversation the way it reopens one that died; a record that can no longer be used comes back as a sentence. `session/turn.ts` calls it first in `run()` and ends the turn with `turnFailed` when it refuses. `session.ts`/`session/context.ts` carry `startedWith`, empty until the first turn settles it. The manifest declares `contracts.agentKinds: ["acp"]` and keeps `presets` in `options`. New test `packages/agent-acp/test/kind.test.ts` (3 cases): the kind's shape, hostOnly, 13 key variables, schema fields, 14 templates (codex's sign-in and key fields, copilot's own switches and no sign-in) and the preset agent beside it; two records opening two backends with their own ids, names and fixture logs, each answering a turn; an edit applied at the next turn, with the second server asked to `session/resume` the same conversation, never `session/new`, and the first server given nothing after the edit.
- **Next action:** task 05 (agent-cofold registers a kind).
- **Files:**
  - `packages/agent-acp/src/plugin.ts`
  - `packages/agent-acp/src/presets.ts`
  - `packages/agent-acp/src/types.ts`
  - `packages/agent-acp/src/session.ts`
  - `packages/agent-acp/src/session/context.ts`
  - `packages/agent-acp/src/session/opening.ts`
  - `packages/agent-acp/src/session/turn.ts`
  - `packages/agent-acp/package.json`
  - `packages/agent-acp/test/kind.test.ts` (new)
- **Open questions:** none. The Answers table settles what this task left open: a plugin's options are the defaults for the whole plugin and a record overrides one where the kind allows it (row 76), which is why `hostTools` and `toolsChanged` are in the kind's schema as overrides while `log` stays the plugin's.
- **Departures:** (1) `presets` is still required and still registers an agent each, because the instruction for this branch is to keep the presets working until task 07 migrates them; step 1's "stop calling `registerAgent` for each preset" is deferred with it, and the kind and the presets coexist because the fold refuses a record id a plugin already serves. (2) The kind's schema is `PER_PRESET` without `displayName`, `description` and `model`, and without `base` and `provider` too: a record names its own program rather than a row, and `provider` is the record's id, which the channel owns. (3) Step 4 lists five host-only fields and `page` is not among them, so a person or a team may carry a vendor's install page. (4) Because `command`, `args`, `cwd`, `machine` and `install` are host-only, a person's or a team's acp record cannot spawn: a client making one from a template leaves those fields out, and such a record has no command until a host record carries one - task 07 migrates the presets into host records, and task 08 documents this. (5) A record signs in only when it names an `authenticate.methodId`, because the row's `fromEnv` auto-sign-in has no row to read; every template whose row has a sign-in names it, so a record made from one signs in when its key is filled in. (6) `env` is not host-only, for the reason task 03 gives: a variable in `keyVariables` is a key any owner may set and every other one is the channel's to refuse. (7) The conversation survives the restart only where the server advertised `session/resume` or `loadSession`; a server that advertised neither cannot continue it, and the turn ends with the bridge's existing sentence rather than a new conversation nobody asked for. The fixture advertises both.
- **Watch out for:** a status, error or log must never carry a key or a secret value. The record's live config holds each key already read from the vault, and it is only ever put into `env` and handed to the spawn: `optionsOfRecord`'s refusals name the record or a field, `refreshOptions` returns only a sentence about the record, and nothing here logs the config or the options.
