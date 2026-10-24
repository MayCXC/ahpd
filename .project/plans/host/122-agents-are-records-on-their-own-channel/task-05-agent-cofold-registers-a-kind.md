---
title: agent-cofold registers a kind
status: done
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

- **Done so far:** the plugin registers the kind `cofold` and no longer registers an agent of its own. In `plugin.ts`, `apply` calls `host.registerAgentKind(kindOf(optionsOf(values)))` and refuses `provider`, `displayName` and `description` with a sentence naming where each is written now (the record's id, name and description), because a configuration that still names one is asking for the single backend this plugin used to serve. `optionsSchema` no longer has those three keys and keeps the rest as plugin-wide defaults (`model`, `baseUrl`, `instructions`, `computerConfigDir`, `store`, `memory`, `tools`, `strictTools`, `apiKey`, `resource`, `adapter`, `autoCompactTokens`, `policy`); it still holds `tools` to cofold's `TOOLS_SCHEMA` unless `strictTools` is false. The kind's `schema` is that option list without `provider`, `displayName`, `description`, `model`, `adapter` and `strictTools`, closed with `additionalProperties: false`, with `tools` replaced by `TOOLS_OF_RECORD` (files, shell, memory and DuckDuckGo only). `apiKey` is `writeOnly`. `hostOnly` is `computerConfigDir`, `store` and `memory`. One template, `Cofold`, sets nothing and says a record made from it runs on the harness configuration at `~/.config/cofold/config.json`. `optionsOfRecord(defaults, record)` builds one record's options: the record's fields over the plugin's, `provider` from the id, `displayName` from the name, the record's `description` and `model` where it has them, and a store at `join(defaults.store ?? defaultStoreRoot(), record.id)`. `open` returns `cofoldAgent({...optionsOfRecord(...), recordOf: () => optionsOfRecord(...)})`. `CofoldOptions` gained `recordOf`. In `session.ts`, `refreshOptions()` reads the record, puts `model`, `baseUrl`, `apiKey`, `instructions`, `resource`, `autoCompactTokens` and `tools` on the shared options object in place, and answers a sentence when the record can no longer be used; `SessionContext` carries it and `turns.ts` calls it first in `beginTurn`'s `start()`, failing the turn with the sentence rather than running on the turn-before's options. The manifest declares `contracts.agentKinds: ["cofold"]` and no longer declares `agents`. The README's options table, its two identity lines and its search-provider note follow. Tests: `test/kind.test.ts` (3 cases: the kind's shape, form, template, host-only fields and no agent beside it; two records opening two backends with their own ids, names and instructions; an edit applied at the next turn and not to the one running), `test/agent-cofold-plugin.test.ts` rewritten to open a record through the kind for its turns and for the paused-run resume, and `test/agent-cofold-options.test.ts` updated for the three refused keys.
- **Next action:** task 06 (agent-pi registers a kind).
- **Files:**
  - `packages/agent-cofold/src/plugin.ts`
  - `packages/agent-cofold/src/agent.ts`
  - `packages/agent-cofold/src/session.ts`
  - `packages/agent-cofold/src/context.ts`
  - `packages/agent-cofold/src/turns.ts`
  - `packages/agent-cofold/package.json`
  - `packages/agent-cofold/README.md`
  - `packages/agent-cofold/test/agent-cofold-plugin.test.ts`
  - `packages/agent-cofold/test/agent-cofold-options.test.ts`
  - `packages/agent-cofold/test/kind.test.ts` (new)
- **Open questions:** none. The Answers table settles what this task left open: plugin options are the defaults for the whole plugin and a record overrides one where the kind allows it (row 76), a record is read live at the start of each turn (rows 71 and 72), and a key field is write-only (row 66).
- **Departures:** (1) `store` is now the folder the records' stores live under, one folder per record named by its id, rather than the store's own path. Two records on one store would each list the other's sessions, because a backend answers `list()` from its store and not from its own sessions, so a person's agent would read another's transcripts; a record may still name its own `store`. (2) A record may not name a keyed search provider (`brave`, `tavily`): the channel vaults a record's top-level `writeOnly` fields only, so a key nested under `tools.web.search` would be written into the record itself. Those two stay plugin options, where a configuration file holds them, and the kind's `tools` schema sets `additionalProperties: false` so a record that tries one is refused where it is written. (3) `adapter` and `strictTools` are not in the kind's schema: the first is an object with methods a JSON record cannot carry, and the second is how the plugin forgives a configuration written for a later cofold, which a record's tools schema does not need because it is closed. (4) `model` is still a plugin option, as the default a record that names none runs on, while a record's own `model` is the channel's field and wins. (5) The plugin's own `cofold` agent is gone: `apply` registers no agent, as step 1 asks, so a daemon whose plugin options described one backend serves no cofold agent until task 07 migrates those options into a host record. The presets kept until task 07 are agent-claude's and agent-acp's, which this task does not touch. (6) A record's `store`, `computerConfigDir`, `memory` and `policy` are read when the record is opened: the session puts only the seven turn fields on the options it runs on, because a store that moved under a running session would lose the conversation it is writing and a policy is what the session's controls were drawn from. (7) The manifest no longer declares `agents: ["*"]`, because nothing registers one; `registerAgentKind` is declared instead.
- **Watch out for:** a status, error or log must never carry a key or a secret value. The record's config holds each key already read from the vault; `optionsOfRecord` puts it into the options and nowhere else, `refreshOptions` answers only a sentence naming the record, and `check` on `tools` names a path rather than a value. Nothing here logs the config or the options.
