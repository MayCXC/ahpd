---
title: Agent kinds on their own channel
domain: host
status: planned
priority: high
created: 2026-10-24
revalidated: 2026-10-24
requires:
  - plans/host/122-agents-are-records-on-their-own-channel/plan.md
refs:
  - "[code://packages/sdk/src/connectors/adapters.ts](../../../../packages/sdk/src/connectors/adapters.ts) - `x-ahpd-adapters`, the channel this plan copies"
  - "[code://packages/sdk/src/agents/channel.ts#L8](../../../../packages/sdk/src/agents/channel.ts#L8) - names `x-ahpd-agent-kinds`, which nothing serves"
  - "[code://packages/sdk/src/types/agents.ts#L96-L148](../../../../packages/sdk/src/types/agents.ts#L96-L148) - `AgentKind` and `ServedAgentKind`, the fields a row sends"
  - "[code://packages/server/src/commands/run.ts#L754](../../../../packages/server/src/commands/run.ts#L754) - where the daemon makes the adapters channel"
  - "[code://packages/server/src/commands/run.ts#L1360-L1367](../../../../packages/server/src/commands/run.ts#L1360-L1367) - where a later load takes the new kinds and refreshes the adapters"
  - "[code://packages/sdk/test/adapters-channel.test.ts](../../../../packages/sdk/test/adapters-channel.test.ts) - the tests to copy"
  - "[code://docs/plugins/PLUGINS.md#L1241-L1248](../../../../docs/plugins/PLUGINS.md#L1241-L1248) - the adapters section the new section copies"
  - "file:///github/ahp-review/briefs/ahpw-agents.md - the brief this plan answers"
---

## Goal

A client lists the agent kinds a host serves, with the form and the templates of each.
ahpw needs this list to add an agent, as it needs `x-ahpd-adapters` to add a connector.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "agent-kinds" packages docs` - only a doc comment in `packages/sdk/src/agents/channel.ts` names the channel.
- A subscribe to `x-ahpd-agent-kinds://` on a test daemon answers `-32001 No channel at x-ahpd-agent-kinds://`.
- `rg -n "templates|icons:" packages/agent-*/src` - no agent plugin registers templates or icons yet.

### Runtime path

```
plugin registerAgentKind -> fold agentKinds -> kinds channel reads agentKinds() -> row per kind -> client draws the kind picker and the form
```

### Gaps

- `Not found: a channel that lists agent kinds - searched "agent-kinds" in packages and docs.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| The kinds are on their own read-only channel, `x-ahpd-agent-kinds`, built like `x-ahpd-adapters` | Softov, 2026-10-24: "ok, build it" on the brief | 01 |
| Reading it takes `agent:list` | (defaulted: `x-ahpd-adapters` takes `connector:list`, the grant of the records made from it) | 01 |
| A row is `name`, `title`, `description`, `schema`, `plugin`, and `icons`, `templates`, `hostOnly` and `keyVariables` when the kind has them | (defaulted: every field of `ServedAgentKind` except `open`) | 01 |

## Proposed architecture

- **Data flow** - `agentKinds()` in run.ts is the source; the channel reads it at each call, as the adapters channel reads `adapters()`.
- **Event flow** - a load or unload refreshes the channel next to `adapterLists.refresh()`.
- **Layer responsibilities** - sdk: the channel. server: the wiring. docs: PLUGINS.md and HOST.md.
- **Source-of-truth files** - [`code://packages/sdk/src/connectors/adapters.ts`](../../../../packages/sdk/src/connectors/adapters.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The agent kinds channel](task-01-the-agent-kinds-channel.md) | todo | - |

## Risks and tradeoffs

- No plugin has templates yet, so a client sees each kind with no template. That is correct, and ahpw offers a blank record.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-agent-kinds-channel.md](task-01-the-agent-kinds-channel.md).
- **Open questions:** none.
- **Watch out for:** a row never carries `open`. A function does not serialize.

## Final verification checklist

- [ ] A subscribe to `x-ahpd-agent-kinds://` on a daemon with agent-claude and agent-cofold lists `claude` and `cofold`.
- [ ] `plans/index.md` updated.
