---
title: A login refused for its limit says so on its row
domain: claude
status: active
priority: high
created: 2026-10-29
revalidated: 2026-10-29
refs:
  - git://650e8525 - the commit the facts were checked at, the tip of plan claude/20261028-2213, which this plan builds on
  - "[code://packages/sdk/src/connectors/channel.ts#L474](../../../../packages/sdk/src/connectors/channel.ts#L474) - `note`, which keeps one call in a connector's health for a host part"
  - "[code://packages/sdk/src/connectors/channel.ts#L913](../../../../packages/sdk/src/connectors/channel.ts#L913) - the check command, which the note command takes after"
  - "[code://packages/server/src/proxy/listener.ts#L774-L793](../../../../packages/server/src/proxy/listener.ts#L774-L793) - the model proxy notes each call of an entry, the ones that worked and the ones that failed"
  - "[code://packages/agent-claude/src/session/logins.ts#L183-L197](../../../../packages/agent-claude/src/session/logins.ts#L183-L197) - a login's failure rests it and asks the host for a check"
  - "[code://packages/agent-claude/src/plugin.ts#L159-L189](../../../../packages/agent-claude/src/plugin.ts#L159-L189) - the plugin asks its host through a connection of its own"
  - "[code://packages/agent-claude/src/session/query.ts#L851](../../../../packages/agent-claude/src/session/query.ts#L851) - a turn's result, which says whether it went through"
  - "[code://docs/plugins/PLUGINS.md#L1426](../../../../docs/plugins/PLUGINS.md#L1426) - a call in a connector's health is one `run` made or one a host part reported"
---

## Goal

A Claude login refused for its limit says so on its connector's row, with the CLI's words and when it is back.
A turn that goes through on a login says so too, so the row says the login works again.
Each is kept in the connector's health, as the model proxy keeps each call of an entry.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "note\(" packages/sdk/src/connectors packages/server/src` - the model proxy is the one caller of `note`, and no command reaches it.
- `rg -n "connectors/check" packages/agent-claude/src` - the plugin asks its host for a check through a connection of its own.
- On one daemon, a login was refused for its usage with a named reset.
  Its check counts tokens, which a spent account still may.
  So its row said `ok` while every turn on it was refused.

### Runtime path

```
CLI: rate_limit, resets at T -> refused -> rest(login, T), failed(login) -> check -> ok
row: health.check ok, nothing about the refusal
```

### Gaps

- A plugin cannot keep a call in a connector's health.
- The Claude engine says a login's failures to nobody but the log and the check.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `x-ahpd/connectors/note` keeps `{ id, ok, status?, error? }` with `note` | A host part's `note`; a plugin acts on its host as a client does, PLUGINS.md | 01 |
| Only the plugin that registered the connector's adapter notes, and the command takes what a check takes | The plugin makes the connector's calls outside `run`; the check's grant and owner rule | 01 |
| A login's refusal is noted with the CLI's words and the reset it named | The proxy notes each failed call; the rest is the reset the failure named | 01 |
| A turn that went through is noted as a call that worked | The proxy notes each call that worked | 01 |
| A call of a token the login no longer holds is not noted | A rest for it is not kept either | 01 |

## Proposed architecture

- **Data flow** - the session's `refused` and `answered` call `OpenLogins.called`, the plugin sends `x-ahpd/connectors/note`, and the channel calls `note`.
- **Event flow** - the row goes out with its health, at most once a second.
- **Layer responsibilities** - sdk: `connectors/channel.ts`; agent-claude: `logins.ts`, `session/logins.ts`, `session/query.ts`, `plugin.ts`.
- **Source-of-truth files** - [`code://packages/sdk/src/connectors/channel.ts`](../../../../packages/sdk/src/connectors/channel.ts), [`code://packages/agent-claude/src/session/logins.ts`](../../../../packages/agent-claude/src/session/logins.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A login's calls are kept on its connector](task-01-a-logins-calls-are-kept-on-its-connector.md) | pending | - |

## Risks and tradeoffs

- Every turn on a login sends one note over the plugin's own connection.
  The rows it changes go out at most once a second.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-logins-calls-are-kept-on-its-connector.md](task-01-a-logins-calls-are-kept-on-its-connector.md).
- **Open questions:** none.
- **Watch out for:** the plugin's configuration needs `connector:put`, and `connector:host` for a host login, as for a check.

## Final verification checklist

- [ ] A note from the plugin of the adapter is kept in the row's health, and a note from anyone else is refused.
- [ ] A login's refusal is noted with its words and when it is back, and a turn that went through as a call that worked.
- [ ] The plugin sends its notes on the connection its checks use.
