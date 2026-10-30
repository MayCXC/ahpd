---
title: A record agent runs in a machine
domain: container
status: built
priority: high
created: 2026-10-30
revalidated: 2026-10-30
requires:
  - plans/host/122-agents-are-records-on-their-own-channel/plan.md
changes: []
creates: []
decisions:
refs:
  - "[code://packages/sdk/src/plugins/plugins.ts#L437](../../../../packages/sdk/src/plugins/plugins.ts#L437) - `agentPlugins` gets the spec of each agent a plugin registers"
  - "[code://packages/sdk/src/plugins/plugins.ts#L566-L584](../../../../packages/sdk/src/plugins/plugins.ts#L566-L584) - the record agents are folded in with no plugin"
  - "[code://packages/sdk/src/host/spawn.ts#L794-L811](../../../../packages/sdk/src/host/spawn.ts#L794-L811) - a nested session is handed the plugin `agentPlugins` names, or none"
  - "[code://packages/sdk/src/host/lifecycle.ts#L527](../../../../packages/sdk/src/host/lifecycle.ts#L527) - a nested delete reads the same map"
  - "[code://packages/sdk/src/sessions/nested.ts#L112-L121](../../../../packages/sdk/src/sessions/nested.ts#L112-L121) - `NestedAsked`, what the start of a host inside is given"
  - "[code://packages/sdk/src/sessions/nested.ts#L956-L957](../../../../packages/sdk/src/sessions/nested.ts#L956-L957) - the refusal a record agent gets today"
  - "[code://packages/sdk/src/agents/channel.ts#L345-L355](../../../../packages/sdk/src/agents/channel.ts#L345-L355) - `opened`, which reads a record's secrets from the vault and opens it with its engine"
  - "[code://packages/computer/src/plugin.ts#L1395-L1420](../../../../packages/computer/src/plugin.ts#L1395-L1420) - `nestedHost`, which starts `ahpd --stdio --plugin` in a machine and gives vault values by name"
  - "[code://packages/server/src/commands/join.ts#L218-L230](../../../../packages/server/src/commands/join.ts#L218-L230) - a dialled node starts its host inside with the env it was asked for"
  - "[code://packages/server/src/commands/run.ts#L884](../../../../packages/server/src/commands/run.ts#L884) - `agentLists`, the agents channel of a host"
  - "[code://packages/agent-cofold/src/plugin.ts#L244](../../../../packages/agent-cofold/src/plugin.ts#L244) - cofold registers an engine and no agent"
  - "[code://packages/agent-pi/src/plugin.ts#L200](../../../../packages/agent-pi/src/plugin.ts#L200) - pi registers an engine and no agent"
  - git://19e23ee7 - engines replace agent kinds; since plan 122 a cofold or pi agent is a record
---

## Goal

A cofold or pi session that names a computer runs in that machine, as it did before agents became records.
Today every such session ends with "this host does not know which plugin serves cofold".
This is true on a machine on this host and on another box's Docker.
The host inside loads the engine's plugin and serves the same record, so the session runs on the record's endpoint, key and model.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "agentPlugins" packages/sdk/src packages/server/src` - only plugin-registered agents are put in the map, at `plugins.ts:437`; the record loop at `plugins.ts:566` adds none.
- `rg "runsNested: true" packages` - cofold and pi, both engine-only since plan 122.
- `rg -i "nested|machine" .project/plans/host/122-agents-are-records-on-their-own-channel` - plan 122 does not mention a nested session.
- `rg "'--stdio'" packages` - the host inside starts from `nestedHost` in the computer plugin and from `join.ts` on a dialled node.

### Runtime path

```
createSession(computer=...) -> spawn.ts agentPlugins[provider] -> nestedAgent plugins -> ComputerPort.nested -> docker exec ahpd --stdio --plugin <spec> -> inner root agents -> inner createSession
```

### Gaps

- A record agent has no entry in `agentPlugins`, so `nestedAgent` gets no plugin and refuses.
- The host inside loads the engine but serves no agent, because the record is on this host only.
- Found by hand on dev02 during container 05 p8 task 05, 2026-10-30.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The fix is its own plan, built now, and p8 task 05 finishes after it merges | Softov, 2026-10-30, picked "Own plan, built now" | 01 |
| A record agent's plugin is the spec of the plugin that registered its engine | (defaulted: the same spec `plugins.ts:437` records for a plugin's own agent) | 01 |
| The record goes into the machine whole, with its vault-resolved secret fields, by name in the env of the command that starts the host inside; never in argv, a label or a file | Softov, 2026-10-30, picked "Yes, by name" | 02 |
| The variable is `AHPD_AGENT_RECORD`, its value the record as JSON | (defaulted: one name, read only by the host inside) | 02 |
| A machine that is handed nothing of this host's vault gets the record without its secret fields; that is a box over ssh, and on main also another box's Docker until container 05 p8 merges | [code://packages/computer/src/plugin.ts#L1407-L1414](../../../../packages/computer/src/plugin.ts#L1407-L1414) - a value read from the vault would be written into the remote command | 02 |
| The host inside serves the record from memory and never writes it to its own `agents` collection | (defaulted: the record holds resolved keys) | 02 |

## Proposed architecture

- **Data flow** - the agents channel keeps the opened record of each record agent. `spawn.ts` and `lifecycle.ts` hand `nestedAgent` the engine's plugin and that record. `NestedAsked.record` carries it to the port. The computer plugin and `join.ts` put it in `AHPD_AGENT_RECORD`. The host inside opens it with its engine at start.
- **Event flow** - no new event; the inner root lists the record's id, and the inner `createSession` names it as it names a plugin's agent today.
- **State flow** - the record lives in the memory of the host inside for the life of that process; nothing is written in the machine.
- **Layer responsibilities** - sdk: the fold and the nested proxy · computer: the env of `nestedHost` · server: `join.ts` and the read of the variable at start.
- **Source-of-truth files** - [`code://packages/sdk/src/agents/channel.ts`](../../../../packages/sdk/src/agents/channel.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the host names a record agent's plugin](task-01-the-host-names-a-record-agents-plugin.md) | done | - |
| [02 - the record reaches the host inside](task-02-the-record-reaches-the-host-inside.md) | done | 01 |
| [03 - docs](task-03-docs.md) | done | 02 |

## Risks and tradeoffs

- The record's keys are in the env of the inner host's process - they reach the machine as a vault-named need does. The session in the machine can read them, as it can read those.
- The host inside does not see an edit to the record until its next start. A running turn ends on the record it started with, as on this host.

## Resume state

- **Done so far:** tasks 01 to 03; see [implemented.md](implemented.md).
- **Next action:** the runs by hand in the checklist, through container 05 p8 task 05.
- **Open questions:** none.
- **Watch out for:** the dialled-node path in `join.ts` and the delete path in `lifecycle.ts` are entry points too. A fix in `nestedHost` alone leaves them broken.

## Final verification checklist

- [ ] A cofold record session on a disposable machine on this host runs a turn.
- [ ] The same on dev02 through p8's `far` profile.
- [x] No argv the fake Docker records holds the record's key.
- [x] A session over ssh gets the record without its secret fields.
- [x] A plugin-registered agent runs nested as before.
