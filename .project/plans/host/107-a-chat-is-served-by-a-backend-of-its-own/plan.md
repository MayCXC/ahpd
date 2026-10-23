---
title: A chat is served by a backend of its own
domain: host
status: planned
priority: medium
created: 2026-10-18
revalidated: 2026-10-23
requires: []
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L728-L740](../../../../packages/sdk/src/host/spawn.ts#L728-L740) - `spawn`, which takes the agent and the config from its caller"
  - "[code://packages/sdk/src/host/spawn.ts#L1540-L1576](../../../../packages/sdk/src/host/spawn.ts#L1540-L1576) - a second chat joins the session's `Held`, and `keepChat` records it"
  - "[code://packages/sdk/src/host/spawn.ts#L1640](../../../../packages/sdk/src/host/spawn.ts#L1640) - `owners.set(uri, agent)`, keyed by session, which a foreign chat would overwrite"
  - "[code://packages/sdk/src/host/state.ts#L13-L46](../../../../packages/sdk/src/host/state.ts#L13-L46) - `Held`, with one `agent` and one `config`"
  - "[code://packages/sdk/src/types/sessions.ts#L94-L134](../../../../packages/sdk/src/types/sessions.ts#L94-L134) - `StoredChat`; `backendId` is the backend's own conversation id, not which backend"
  - "[code://packages/sdk/src/host/chatrecord.ts#L106-L143](../../../../packages/sdk/src/host/chatrecord.ts#L106-L143) - `keepChat`, which builds the row field by field"
  - "[code://packages/sdk/src/sessions/sessions.ts#L381-L401](../../../../packages/sdk/src/sessions/sessions.ts#L381-L401) - `chatsOf`, the parser of the stored chats"
  - "[code://packages/sdk/src/host/lifecycle.ts#L953](../../../../packages/sdk/src/host/lifecycle.ts#L953) - `backendsOwn`, the config a backend is handed"
  - "[code://packages/sdk/src/host/sleep.ts#L245-L336](../../../../packages/sdk/src/host/sleep.ts#L245-L336) - the restore after a daemon restart, one agent for every chat"
  - "[code://packages/sdk/src/host/chatactions.ts#L1004-L1007](../../../../packages/sdk/src/host/chatactions.ts#L1004-L1007) - a `scope: 'session'` key is pushed to every chat"
  - "[code://packages/sdk/src/host/common.ts#L44-L48](../../../../packages/sdk/src/host/common.ts#L44-L48) - `HOSTS_OWN`, the keys no backend owns; `computer` is not one of them"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1312](../../../../packages/sdk/src/host/sessionmethods.ts#L1312) - a move refuses two providers"
  - "[code://packages/sdk/src/types/host.ts#L922-L934](../../../../packages/sdk/src/types/host.ts#L922-L934) - `ToolCall.create` already takes a `provider`; `createChat` does not"
  - "[code://packages/sdk/src/host/tooling.ts#L1533-L1572](../../../../packages/sdk/src/host/tooling.ts#L1533-L1572) - `ToolCall.createChat`, spawned with the session's agent"
  - "[code://packages/sdk/src/types/plugin.ts#L786](../../../../packages/sdk/src/types/plugin.ts#L786) - `PluginHost.startSession`, the seam the bot uses from a wake"
  - "[code://packages/sdk/src/host/automations.ts#L932-L945](../../../../packages/sdk/src/host/automations.ts#L932-L945) - `beginPluginSession`, which asks the owner's `session:create` first"
  - "[code://packages/sdk/src/host/snapshots.ts#L324-L335](../../../../packages/sdk/src/host/snapshots.ts#L324-L335) - the live `ChatState`, where `_meta` can carry the chat's backend"
  - "[code://packages/bot/src/wake.ts#L298](../../../../packages/bot/src/wake.ts#L298) - the bot starts a Back from a wake hook, not from a tool call"
  - "npm://@microsoft/agent-host-protocol@1.0.0 - `ChatState` has `_meta`; `ChatSummary` has none"
---

## Goal

One chat of a session can be served by a backend other than the session's own.
The bot plugin needs this for a bot's Back chat.
The session is the bot's, and the Back chat runs a harness, such as Claude, cofold or pi.
Two Back chats of one session can use two different harnesses.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "spawn\(" packages/sdk/src/host` - every chat is spawned with the session's `held.agent`: a new chat, a plugin chat, a move, a restart, `restartChat`, a rewind and the restore.
- `rg -n "owners.set|keepProvider" packages/sdk/src/host` - the session's owner and stored provider are written from the spawned agent.
- `rg -n "backendId" packages/sdk/src/types/sessions.ts` - a chat row keeps its backend's conversation id, and no provider.
- `rg -n "_meta" agent-host-protocol/types/channels-chat/state.ts` - `ChatState` has `_meta`, `ChatSummary` has none.

### Runtime path

```
bot wake -> PluginHost.startChat(session, { provider, model, config, prompt })
  -> owner's chat:create -> agent of that provider -> config read against its schema
  -> spawn(chat's agent, ...) -> Held.backends[chat] -> StoredChat.provider and config
restart, restartChat, rewind, daemon restore -> the chat's own agent and config
client -> ChatState._meta['ahpd.provider']; the session keeps its own provider
```

### Gaps

- A session holds one agent, and every chat is spawned with it.
- A chat row does not say which backend serves it, so a restore cannot start the right one.
- A session's config is the schema of one backend; a chat of another backend has keys the session does not have.
- A plugin can name a chat's model, but not its provider, and only from inside a tool call.
- AHP gives a session one `provider`, and a message's `agent` selects within that provider only.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A person's Front and Back are one session with two chats, and the bot provider owns the session | Softov, 2026-10-18, chose "Bot provider owns it" for "Should one person's Front and Back be one session with two chats, served by the bot provider?" | - |
| A Back chat can use another harness than the session's other chats | Softov, 2026-10-18, "even another harness on another chat, right?" | - |
| Only a plugin names a chat's backend; a client's AHP `createChat` stays as it is | (defaulted: AHP `createChat` has no provider, and a session has one) | 03 |
| A plugin names it through a new `PluginHost.startChat`, beside `startSession`, and through `ToolCall.createChat`, which gains `provider` and `config`; both use one host helper | (defaulted: the bot starts a Back from a wake hook, `code://packages/bot/src/wake.ts#L298`, where no `ToolCall` exists) | 03 |
| `provider` is needed beside `model`, because a model id is bare and the same id can be in two harnesses | `code://packages/sdk/src/tools/session.ts#L285-L290` resolves a model only within the session's provider | 03 |
| `startChat` asks the session owner's `chat:create` first, as `startSession` asks `session:create` | (defaulted: `code://packages/sdk/src/host/automations.ts#L932-L945`) | 03 |
| `StoredChat` gains `provider?` and `config?`; an absent `provider` is the session's provider | (defaulted: a row written before this plan reads as before) | 01 |
| A foreign chat's backend is held per chat on `Held`, and it never writes the session's owner or stored provider | `code://packages/sdk/src/host/spawn.ts#L1640` | 01 |
| A foreign chat's config is checked against its own backend's schema, and it also gets the session's keys that no backend owns, such as `computer` and the contributed session keys | (defaulted: `computer` places the chat's machine, `code://packages/sdk/src/host/common.ts#L44-L48`) | 02, 03 |
| A `scope: 'session'` key of the session's backend is not pushed to a foreign chat | `code://packages/sdk/src/host/chatactions.ts#L1004-L1007` | 02 |
| `session/configChanged` on a foreign chat is refused for now | (defaulted: AHP `ChatConfigState` is read against the session's schema) | 02 |
| A restart, `restartChat`, a rewind and the daemon restore start each chat with its own backend | (defaulted: a chat must come back on the backend it had) | 02 |
| At restore, a chat whose backend is not loaded is logged and skipped, and the other chats start | (defaulted: one missing plugin does not stop the session) | 02 |
| A move of a foreign chat is refused for now, and a fork or side chat reads the source chat's backend | (defaulted: `code://packages/sdk/src/host/sessionmethods.ts#L1312` already refuses two providers) | 02 |
| A client sees the session's provider; the chat's backend is in `ChatState._meta['ahpd.provider']` | (defaulted: the `ahpd.*` key pattern, as `ahpd.owner`) | 04 |
| A chat's catalogue row does not show its backend, because `ChatSummary` has no `_meta` | npm://@microsoft/agent-host-protocol@1.0.0 | - |

## Proposed architecture

- **Data flow** - `StoredChat` keeps `provider` and `config`. `Held.backends` maps a foreign chat to its agent and config.
- **Event flow** - unchanged; a foreign chat's actions reach clients through the session's chat channel.
- **State flow** - `chatAgent(held, chat)` and `chatConfig(held, chat)` answer the chat's own, or the session's.
- **Layer responsibilities** - sdk host: the record, the spawn sites, the seam and `_meta`. docs: PLUGINS.md and the changelog.
- **Source-of-truth files** - [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts), [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A chat keeps the backend that serves it](task-01-a-chat-keeps-the-backend-that-serves-it.md) | todo | - |
| [02 - Every start uses the chat's own backend](task-02-every-start-uses-the-chats-own-backend.md) | todo | 01 |
| [03 - A plugin starts a chat on a backend](task-03-a-plugin-starts-a-chat-on-a-backend.md) | todo | 01, 02 |
| [04 - A client sees the chat's backend](task-04-a-client-sees-the-chats-backend.md) | todo | 03 |

## Risks and tradeoffs

- Many sites read `held.agent`; one that is missed starts a foreign chat on the session's backend after a restart.
  Task 02 tests each start path with two agents.
- A chat list in a client cannot show which harness serves a Back until AHP adds `_meta` to `ChatSummary`.

## Resume state

- **Done so far:** drafted 2026-10-18; tasks written 2026-10-23 from a code map of every spawn site.
- **Next action:** task 01.
- **Open questions:** none.
- **Watch out for:** `keepChat` builds the row field by field, so a new field is lost unless it is copied from the old row.
  `deletedChat` and `tokensFor` take the session's agent today.

## Final verification checklist

- [ ] A session of agent A with a chat of agent B starts B again after a session restart, `restartChat`, a rewind and a daemon restart.
- [ ] The session's provider stays A, and `ChatState._meta['ahpd.provider']` names B.
- [ ] `PluginHost.startChat` refuses an owner without `chat:create`, and an unknown provider.
- [ ] `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm test` pass.
- [ ] `docs/plugins/PLUGINS.md`, `CHANGELOG.md` and `plans/index.md` updated.
