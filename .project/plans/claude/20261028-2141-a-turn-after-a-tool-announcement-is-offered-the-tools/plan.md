---
title: A Claude turn begun after a client announced its tools is offered them
domain: claude
status: built
priority: high
created: 2026-10-28
revalidated: 2026-10-28
requires: []
changes:
  - specs/agent-backends.md
refs:
  - "[code://packages/sdk/src/host/tooling.ts#L1267-L1280](../../../../packages/sdk/src/host/tooling.ts#L1267-L1280) - `retool`, which hands each chat its tools when the clients move and does not wait for them to land"
  - "[code://packages/agent-claude/src/session/clienttools.ts#L492-L515](../../../../packages/agent-claude/src/session/clienttools.ts#L492-L515) - `setTools`, two `setMcpServers` calls the CLI answers once it has the servers"
  - "[code://packages/agent-claude/src/session/turns.ts#L162-L230](../../../../packages/agent-claude/src/session/turns.ts#L162-L230) - `beginTurn`, which marks `beginning` while it waits on a model switch, and sends the prompt at its end"
  - https://github.com/microsoft/agent-host-protocol/blob/5872a476bb5aa4e688bd6e8ca0866543f1f7ea13/types/channels-session/state.ts#L171-L182 - `activeClients`, the clients providing tools to the session, each set with `session/activeClientSet`
  - https://github.com/microsoft/agent-host-protocol/blob/5872a476bb5aa4e688bd6e8ca0866543f1f7ea13/types/channels-session/state.ts#L272-L273 - `SessionActiveClient.tools`, the tools a client provides to the session
  - https://github.com/microsoft/agent-host-protocol/blob/5872a476bb5aa4e688bd6e8ca0866543f1f7ea13/docs/specification/subscriptions.md#L237 - `serverSeq`, the position of an action in the server's order of actions
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeAgentSession.ts#L1387-L1389 - the reference's `setClientTools` records a client's tools and sends nothing
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeAgentSession.ts#L1089-L1105 - its `send` rebuilds the query with the new tools, and waits for that, before it sends the turn's prompt
---

## Goal

A Claude turn that a client starts after it announced its tools is offered those tools.
Changes of tools reach the CLI one at a time, in the order they came.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "setTools" packages/sdk/src packages/agent-claude/src` - the host hands the tools over in `retool` without waiting; the backend sends them with `setMcpServers`.
- A live client run on 2026-10-28: the client set itself active with its 13 room tools, then sent a room message as a turn about a second later.
  The model's request for that turn held none of the room tools, and a later turn on the same CLI held all 13.
- Two changes close together both start before either lands, and the SDK connects only a server name it does not have, so the second can leave the first set in place.

### Runtime path

```
session/activeClientSet -> retool -> setTools: setMcpServers without ahp, then with the new ahp (answered later)
chat/turnStarted -> beginTurn -> push the prompt at once -> the CLI reads it before it has the tools
```

### Gaps

- A turn does not know a change of tools is on its way.
- A change does not wait for the one before it.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A turn begun after a client announced its tools is a turn of a session that has them. | AHP's `serverSeq`, one order of actions; `SessionActiveClient.tools` | 01 |
| The prompt goes to the CLI only once the CLI has answered the change in hand. | The reference's `send`, which waits on the rebuild with the new tools before the prompt | 01 |
| The change in hand is held on the session as `retooling`, and the turn waits for it under `beginning`. | [code://packages/agent-claude/src/session/turns.ts#L224-L226](../../../../packages/agent-claude/src/session/turns.ts#L224-L226), the model switch a turn already waits on | 01 |
| A change goes out at once when none is in hand, and after the one in hand otherwise. | AHP's order of actions; the SDK connecting only a name it does not have (the `setTools` comment) | 01 |
| A turn with no change in hand starts as it does today. | `(defaulted: nothing to wait for)` | 01 |
| The tools are still taken with `setMcpServers` on the running CLI, where the reference restarts its query. | `(defaulted: the SDK takes the servers on a live query, and a restart would cost the turn its CLI)` | 01 |

## Proposed architecture

- **Data flow** - a client's tools -> `setTools` -> `setMcpServers` -> the CLI; a turn's prompt -> the CLI after that.
- **Event flow** - `setTools` chains its change behind `retooling`; `beginTurn` awaits `retooling` before it starts.
- **State flow** - `retooling`, on the session context, while a change is in hand.
- **Layer responsibilities** - agent-claude only.
- **Source-of-truth files** - [`code://packages/agent-claude/src/session/clienttools.ts`](../../../../packages/agent-claude/src/session/clienttools.ts), [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a-turn-waits-for-the-tools](task-01-a-turn-waits-for-the-tools.md) | done | - |

## Risks and tradeoffs

- A CLI that never answers a change holds the next turn in `beginning` for as long; the SDK's own control timeout bounds it.

## Resume state

- **Done so far:** task 01, 2026-10-28; [implemented.md](implemented.md) says what exists.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a change with none in hand must still go out at once, since cases read the server it builds right after the call.

## Final verification checklist

- [x] Each new case fails before its task and passes after it.
- [x] `pnpm boundary`, `pnpm typecheck`, `pnpm build` and `pnpm schema` pass.
- [x] The agent-claude, sdk and server suites pass at one worker, once, after the change.
- [x] The spec has the scenario and the changelog the entry.
