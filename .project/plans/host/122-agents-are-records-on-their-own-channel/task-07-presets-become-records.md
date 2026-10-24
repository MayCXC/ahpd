---
title: Presets become records at the first start
status: implemented
depends: [task-03-agent-claude-registers-a-kind.md, task-04-agent-acp-registers-a-kind.md, task-05-agent-cofold-registers-a-kind.md, task-06-agent-pi-registers-a-kind.md]
layer: "server, bot"
refs:
  - "[code://packages/server/src/commands/configure.ts#L162-L200](../../../../packages/server/src/commands/configure.ts#L162-L200) - `takePreset`, which writes `presets` today"
  - "[code://packages/bot/src/record.ts#L104-L105](../../../../packages/bot/src/record.ts#L104-L105) - a bot names its agent by id"
---

## Objective

At its first start on this version, the daemon makes one host record per preset in `config.json`, with the same id. Then `presets` and the per-agent options leave `config.json`, and `ahpd configure` writes a record.

## Files

- `CREATE: packages/server/src/agents/migrate.ts` - the migration from `config.json` to records.
- `UPDATE: packages/server/src/commands/run.ts` - run the migration before the plugins load.
- `UPDATE: packages/server/src/commands/configure.ts:162-200` - write an agent record, not a preset.
- `UPDATE: packages/bot/src/record.ts:104-105` - show `unavailable` when the named agent does not exist.
- `CREATE: packages/server/test/agents-migrate.test.ts` - the migration tests.

## Steps

1. Read the `presets` of agent-claude and agent-acp, and the per-agent options of agent-cofold and agent-pi.
2. Write one host record per preset, with the preset key as the id.
3. Write a `claude` record unless the agent-claude presets set `claude` to `false`.
4. Write one record for agent-cofold and one for agent-pi, with their `provider` option as the id.
5. Keep each `$secret` and each `fromEnv` as it is, and move no key value.
6. Write every record first, and rewrite `config.json` last, so a failure leaves the old file.
7. Remove `presets` and the per-agent options from `config.json`.
8. Log one line that names the records made, with no field values.
9. Do nothing when `config.json` has no preset.
10. Make `takePreset` write a host record through the channel code.
11. Show a bot `unavailable` when its `preset` names no agent.

## Validation

- `packages/server/test/agents-migrate.test.ts` migrates two claude presets, two acp presets, cofold and pi.
- It expects six records with the same ids.
- A test expects a second start to change nothing.
- A test fails the write of one record and expects `config.json` unchanged.
- The gate passes.
- By hand, Softov starts his daemon on this build and starts a session on `claude-deepseek-build`.

## Resume

- **Done so far:** steps 1-11. The daemon runs `migratePresets` before any plugin loads. It plans from the effective specs, so a `--plugin-option` override counts and a bare `--plugin @ahpd/agent-claude` yields the built-in `claude` record. It writes one `owner: "host"` record per preset with the preset key as the id (the `provider` option for cofold and pi), keeps every `$secret` and `fromEnv` as written, writes every record before it touches the file, copies the file to `config.json.bak-<stamp>`, writes a temp name and renames it over, logs one line of ids only, and does nothing at a second start. `ahpd configure` writes a host record through the same `agents` collection (`takeAgent`, `dropAgent`) and names `@ahpd/agent-acp` in the file. A bot read whose `preset` names an agent the host does not serve merges `state: "unavailable"`. `run.ts` folds the records into the load before `createHost`, so a daemon with records only starts, and the empty-agent refusal is on the folded list. `presets` left the manifests of `@ahpd/agent-claude` and `@ahpd/agent-acp`; `presets: { required: true }` would have listed every fresh spec `unconfigured: needs presets`.
- **Next action:** task 08, the docs. The by-hand check in the Validation is Softov's: start his daemon on this build and start a session on `claude-deepseek-build`.
- **Files:** `CREATE packages/server/src/agents/migrate.ts`, `CREATE packages/server/test/agents-migrate.test.ts`, `UPDATE packages/server/src/commands/run.ts`, `UPDATE packages/server/src/commands/configure.ts`, `UPDATE packages/server/src/found.ts`, `UPDATE packages/server/src/plugins.ts`, `UPDATE packages/server/src/commands/options.ts` (a stale comment), `UPDATE packages/bot/src/{record,provider,plugin}.ts`, `UPDATE packages/agent-claude/{src/options.ts,src/plugin.ts,package.json}`, `UPDATE packages/agent-acp/{src/plugin.ts,src/presets.ts,package.json}`, and the tests of those packages (`agent-acp/test/{kind,agent-acp-catalog,agent-acp-machine,agent-acp-options,agent-acp-plugin,agent-acp-presets}`, `agent-claude/test/{kind,agent-claude-declarations,agent-claude-options,agent-claude-options-schema,agent-claude-presets,agent-claude-shared-listing}`, `bot/test/bot-provider`, `server/test/{server-configure,server-root-config}`).
- **Open questions:** `eachPreset` in `packages/sdk/src/plugins/plugins.ts` is exported and tested but no plugin calls it any more. Removing a public export is an SDK break, so it is left for a task that says so.
- **Departures:**
  - A preset whose id is not a slug, or whose id another kind planned first, is logged and skipped, but it is still taken out of the file because step 7 says every preset leaves it. The plugin whose options are stripped is not the one that dropped it.
  - `configure` writes a record during the questions, before the file, the way it already writes the token file first. A setup that stops at a later question therefore leaves a record behind. `configuredAgents` counts a record only when the file names `@ahpd/agent-acp`, so the next run asks about the agent again and adds the plugin, rather than treating an unserved record as configured.
  - A file that cannot be read is reported without the parser's own words, because a parser quotes the text it choked on and the file may hold a key.
  - `server-root-config.test.ts` lost the two masking cases written on claude `presets` (the option is gone); they now use cofold's nested search-provider keys, which are the same shape.
  - The daemon's `machineNeeds` answers `undefined` only when no agent has a provider, so it is an existence test; the bot asks it through `host.machineNeeds`. The bot test harness now hands `pluginHost` the live `agents` list, as `run.ts` does.
- **Watch out for:** a status, error or log must never carry a key or a secret value.
