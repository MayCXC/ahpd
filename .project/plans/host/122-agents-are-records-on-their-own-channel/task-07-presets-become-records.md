---
title: Presets become records at the first start
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a status, error or log must never carry a key or a secret value.
