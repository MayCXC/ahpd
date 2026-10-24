---
title: The agents channel
status: implemented
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

- **Done so far:** `packages/sdk/src/types/agents.ts` holds `AgentKind`, `AgentRecord`, `AgentOwner`, `AgentView`, `AgentState`, `AgentHealth` and `AgentTemplate`. `packages/sdk/src/agents/channel.ts` builds `agentsChannel` over `recordsChannel` on `x-ahpd-agents`: `list`/`get`/`put`/`remove`/`check`, gated by `agent:list`, `agent:put` and `agent:remove`, with `agent:host` for a host record, a membership for a team record and the same person for a user record. Each row carries a `state` of `ready`, `invalid` or `unavailable`; `check` opens the kind, runs its probe under a ten-second limit and answers its health. A `put` or a `remove` takes a new fold through `host.replace`, which sends `root/agentsChanged`; a record edited in place fills the live view, so the agent and its sessions stay, and a `remove` ends the sessions first. Secrets go to the vault under `agent/<id>/<field>`, `env.<name>` values included, and no row, answer, error or log line carries one. The connectors code both channels share moved to `packages/sdk/src/channels/owners.ts`; the connectors channel's words, paths and tests are unchanged and still pass. `packages/sdk/test/agents-channel.test.ts` has 23 tests.
- **`agent:all`:** the Answers row Softov committed as d36439f2. `mayRead` answers true for `agent:all` before the `agent:list` and ownership checks, and the read gate advertises it as an also-grant, so a reader holding only `agent:all` subscribes to a store with no records of its own and reads every row. A remove's `authorize` and its owner check both let `agent:all` through, so it removes an agent whoever owns it. `OPERATIONS.agent` lists `all` and the `USERS.md` row says what it does; `admin` already holds `*:*`, so it has the grant without a role table in code. One test has `ja` read another person's, another team's and the host's agents, then remove the other person's.
- **Review fixes:** an agent must be named by its record's id: `opened` throws when `kind.open` answers another `provider`, so a record is served under no id but its own, a put answers the error and writes nothing, and a record already on disk is said and listed `invalid`. `Opened` keeps the kind object rather than its name, so a plugin reload opens the record again and ends its sessions, as an unload does. A put of a new id asks `holderOf` before writing and refuses an id the daemon or a plugin already serves, naming the holder. A secret read that fails for an open record keeps its last good view and agent and only says the problem, so a vault hiccup does not end live sessions. `put`, `remove`, `check`, `openAll` and `agents` run one at a time through one promise chain, so two puts of one id cannot both find it free.
- **Next action:** task 02, the caller's own agent list.
- **Files:** `packages/sdk/src/types/agents.ts`, `packages/sdk/src/agents/channel.ts`, `packages/sdk/src/channels/owners.ts`, `packages/sdk/src/connectors/channel.ts`, `packages/sdk/src/types/plugin.ts`, `packages/sdk/src/types/host.ts`, `packages/sdk/src/types/index.ts`, `packages/sdk/src/plugins/plugins.ts`, `packages/sdk/src/plugins/validate.ts`, `packages/sdk/src/access/users.ts`, `packages/sdk/src/index.ts`, `packages/server/src/plugins.ts`, `packages/server/src/applyplugins.ts`, `packages/server/src/commands/run.ts`, `packages/sdk/test/agents-channel.test.ts`, `packages/sdk/test/users-host.test.ts`, `docs/sdk/USERS.md`.
- **Departures:** the shared code went to a new `packages/sdk/src/channels/owners.ts` rather than staying in the connectors file, and the connectors channel imports it from there. `foldHostOptions` now answers `records`, the ids of the records it folded, because an agent dropped by an id clash is not distinguishable from an accepted one otherwise; `PluginSet.fold` takes the record agents as an argument. `applyPlugins` grew a `records?()` option: it folds before `host.replace`, so without the daemon's current record agents a live plugin change would drop every stored agent for the length of the change. `AgentsChannelOptions` grew `holderOf`: run.ts answers the daemon, `plugin <name>` or an agent record, read from the loaded plugins and the last fold. `check` is bounded at ten seconds. The `agent` subject was added to `OPERATIONS` and to the grants table in `docs/sdk/USERS.md`, because a role editor reads subjects from `_meta['ahpd.grants']`; the built-in `admin` holds `*:*` and `member` names none of the four, so step 16 holds without a role table in code.
- **Open questions:** `run.ts` still refuses to start when the fold holds no agent, and it reads only `folded.agents`; a daemon whose only agents come from records would exit before any record is opened, which task 07's first start has to settle. There is no separate admin role table, so `agent:all` reaches `admin` only through its `*:*`. `applyPlugins` replaces the host fold with the plugin fold, which removes the `connectors` port until the daemon's own `refoldAgents` puts it back; the call to `agentLists.openAll()` in the plugin-change path is what restores it, so that call must stay.
- **Watch out for:** a status, error or log must never carry a key or a secret value. The record's live view is filled rather than replaced on an edit, and replacing it would end the sessions that run on the agent.
