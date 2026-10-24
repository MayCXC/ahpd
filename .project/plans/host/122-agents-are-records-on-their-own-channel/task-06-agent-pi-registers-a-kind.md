---
title: agent-pi registers a kind
status: done
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

- **Done so far:** the plugin registers the kind `pi` and no longer calls `registerAgent`, so every pi agent is a record on the agents channel. `optionsSchema` is the plugin's defaults only (`model`, `projectTrust`, `sessionDir`); the record's schema is those minus `model` plus `env`, whose one write-only property per `PI_KEY_VARIABLES` name is what the channel vaults, and `keyVariables` is the same list. `hostOnly` is `sessionDir`, the one field that chooses where a host keeps files. One template, `pi`, with an empty config. `apply` refuses `provider`, `displayName` and `description` with "options.<key> is written per record now, as <where>". `kind.open(view)` builds the options from the live view (`provider: record.id`, `displayName: record.name`, `description`, `record.model`, `env` from `record.config.env`) and passes a `recordOf` reader to the session; `PiOptions` gained `env`, `recordOf` and `open` (the embedder/test seam). `piSession` copies `model`, `env` and `projectTrust` off the record at the start of each turn (`LIVE_KEYS`/`refreshOptions`), announces and chooses a record model that moved since the last turn, and calls `backend.useEnv(options.env)` in `build` (before the model list) and in `begin` (before the request). `PiBackend.useEnv` resolves each provider's key through pi's own `ApiKeyAuth.resolve` against an env made of the record's variables alone, then `setRuntimeApiKey`, keeping a `keyed` map and undoing a variable that is no longer named with `removeRuntimeApiKey`, so nothing is written to `process.env`. Tests: `test/kind.test.ts` (3 cases: kind shape/template/host-only/key variables; two records to two backends with their own id, name, model, trust and variables; an edit applied at the next turn, not the running one), `test/agent-pi-options.test.ts` reworked for the new option set and the three refused keys, `test/agent-pi-lazy.test.ts` opens a record through the kind, the four other fakes answer `useEnv`. README has an Agents section and a record table; `package.json` declares `contracts.agentKinds: ["pi"]` and the three options. Full gate passes: 422 files, 6947 tests, 29 skipped.
- **Next action:** task 07, not started.
- **Files:** UPDATE `packages/agent-pi/src/plugin.ts` (kind, record schema, `optionsOfRecord`, `apply` refusals), `packages/agent-pi/src/types.ts` (`env`, `recordOf`, `open`), `packages/agent-pi/src/agent.ts` (passes `options.open`), `packages/agent-pi/src/backend.ts` (`useEnv` on `PiBackend`, the `keyed` map), `packages/agent-pi/src/session.ts` (`LIVE_KEYS`, `refreshOptions`, record-model choose, two `useEnv` calls), `packages/agent-pi/test/agent-pi-options.test.ts`, `packages/agent-pi/test/agent-pi-lazy.test.ts`, `packages/agent-pi/test/agent-pi-usage.test.ts`, `packages/agent-pi/test/agent-pi-truncate.test.ts`, `packages/agent-pi/test/agent-pi-fork.test.ts`, `packages/agent-pi/test/fake-pi.ts`, `packages/agent-pi/README.md`, `packages/agent-pi/package.json`; CREATE `packages/agent-pi/test/kind.test.ts`.
- **Open questions:** none.
- **Departures:** (1) A variable pi resolves to request headers rather than a key, which is `ANTHROPIC_AUTH_TOKEN`, cannot be expressed as a runtime key, so a record that sets only that variable is not applied; every variable that resolves to an api key (`ANTHROPIC_API_KEY`, `ANTHROPIC_OAUTH_TOKEN`, the other `*_API_KEY` names) is. (2) The plugin no longer registers an agent of its own, as cofold's task 05 did, so a config that named one by `provider` gets it from the agents channel instead; claude's and acp's presets are untouched, so the daemon still serves `claude-deepseek-build`. (3) `sessionDir` is host-only, because it chooses where a host keeps files; `projectTrust` is not, because it decides what an agent loads rather than running a program of the record's own. (4) The manifest declares `contracts.agentKinds` instead of `agents: ["*"]`, so the loader knows the plugin serves pi records and not a wildcard of agents.
- **Watch out for:** a status, error or log must never carry a key or a secret value. `useEnv`'s `AuthContext.fileExists` answers false so a record's variables are the only source it reads, and a failure to resolve is swallowed into "no key" rather than reported.
