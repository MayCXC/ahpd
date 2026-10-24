---
title: The agents channel
status: todo
depends: []
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/connectors/channel.ts#L173](../../../../packages/sdk/src/connectors/channel.ts#L173) - `connectorsChannel`, the code the agents channel shares"
  - "[code://packages/sdk/src/connectors/channel.ts#L204-L224](../../../../packages/sdk/src/connectors/channel.ts#L204-L224) - `ownerAllows`, the owner rules"
  - "[code://packages/sdk/src/types/plugin.ts#L1164](../../../../packages/sdk/src/types/plugin.ts#L1164) - `registerAdapter`, the shape of `registerAgentKind`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L965-L968](../../../../packages/sdk/src/plugins/plugins.ts#L965-L968) - a kind is registered while `apply` runs, a record after"
  - "[code://packages/sdk/src/types/host.ts#L1273-L1304](../../../../packages/sdk/src/types/host.ts#L1273-L1304) - `replace` and `endSessionsOf`"
  - "[code://packages/server/src/commands/run.ts#L745](../../../../packages/server/src/commands/run.ts#L745) - where the daemon makes the connectors channel"
---

## Objective

A plugin registers an agent kind, and the channel `x-ahpd-agents` adds, edits, checks and removes records of that kind while the daemon runs.
Each record is one agent in the root state's agent list.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:1164` - add `registerAgentKind(kind)` next to `registerAdapter`.
- `CREATE: packages/sdk/src/types/agents.ts` - `AgentKind`, `AgentRecord`, `AgentOwner` and the live record view.
- `CREATE: packages/sdk/src/agents/channel.ts` - the channel: records on disk, `list`, `get`, `put`, `remove`, `check`, owners, grants and the vault.
- `UPDATE: packages/sdk/src/connectors/channel.ts` - move the parts both channels use, such as the owner rules and the secret fields, into a shared module.
- `UPDATE: packages/sdk/src/plugins/plugins.ts` - keep the registered kinds, and fold one agent per record into `options.agents`.
- `UPDATE: packages/server/src/commands/run.ts:745` - make the agents channel next to the connectors channel.
- `CREATE: packages/sdk/test/agents-channel.test.ts` - the channel tests.

## Steps

1. Define `AgentKind` with `name`, `title`, `description`, `schema`, `icons`, `templates`, `hostOnly`, `keyVariables` and `open(record)`.
2. Define `AgentRecord` as `{ id, kind, owner, name, description?, icon?, model?, config }`.
3. Make `AgentOwner` the same type as `ConnectorOwner`.
4. Add `registerAgentKind` to the plugin host, and refuse it after `apply` returns.
5. Move the owner rules and the secret field code of the connectors channel into a shared module.
6. Keep the connectors channel's behaviour and its tests unchanged after the move.
7. Store each record in `~/.config/ahpd/agents/<id>.json`, and each `writeOnly` field in the vault under `agent/<id>/<field>`.
8. Check `config` against the kind's schema on `put`, and answer each error with its field path.
9. Refuse a `put` whose id another owner holds.
10. Refuse a `put` of a team or user record that sets a field in the kind's `hostOnly` list.
11. Refuse an `env` variable on a team or user record unless it is in the kind's `keyVariables`.
12. Refuse `fromEnv` on a team or user record, as the connectors channel does.
13. Gate `list` with `agent:list`, `put` with `agent:put` and `remove` with `agent:remove`.
14. Require `agent:host` for a host record and a membership for a team record.
15. Require the same person for a user record.
16. Give the `admin` role the four `agent:*` grants, and give `member` none.
17. Give each listed row a state, `ready`, `invalid` or `unavailable`, and show `unavailable` when its kind is not loaded.
18. Make `check` call `kind.open` and the agent's probe, and answer its health.
19. On `put` of a new record, call `kind.open` and take a new fold with `host.replace`.
20. On `put` of a known record, update the live record view and keep the agent and its sessions.
21. On `remove`, call `endSessionsOf(id)`, then remove the record and its secrets, then take a new fold.
22. Give `open` a live view, so a session reads the current record at the start of each turn.
23. Keep a key value out of every row, answer, error and log line.

## Validation

- `packages/sdk/test/agents-channel.test.ts` tests put, edit, remove, check, each grant and a missing kind.
- It also tests an id that another owner holds, and a host-only field on a team record.
- It also tests an `env` variable outside `keyVariables`, and `fromEnv` on a user record.
- It also expects no key value in any answer.
- A test puts a record and expects one `root/agentsChanged` with the new agent.
- A test removes a record and expects its session to end.
- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a status, error or log must never carry a key or a secret value.
