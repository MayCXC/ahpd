---
title: A chat is served by a backend of its own
domain: host
status: draft
priority: medium
created: 2026-10-18
revalidated: 2026-10-18
requires: []
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L526-L538](../../../../packages/sdk/src/host/spawn.ts#L526-L538) - `spawn`, which starts every chat of a session with one `agent`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L181](../../../../packages/sdk/src/host/sessionmethods.ts#L181) - a new chat is spawned with the session's held agent"
  - "[code://packages/sdk/src/host/lifecycle.ts#L735-L767](../../../../packages/sdk/src/host/lifecycle.ts#L735-L767) - a restored session spawns its chats with the session's agent"
  - "[code://packages/sdk/src/host/chatrecord.ts#L122](../../../../packages/sdk/src/host/chatrecord.ts#L122) - a chat row keeps its `backendId`, but not which backend it is"
  - "[code://packages/sdk/src/types/agent.ts#L505-L560](../../../../packages/sdk/src/types/agent.ts#L505-L560) - `chats` and the config `scope`, where a key is the session's or the chat's"
---

## Goal

One chat of a session can be served by a backend other than the session's own.
The bot plugin needs this for a bot's Back chat.
The session is the bot's, and the Back chat runs a harness, such as Claude, cofold or pi.
Two Back chats of one session can use two different harnesses.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "spawn\(" packages/sdk/src/host` - every chat of a session is spawned with the session's held agent.
- `rg -n "backendId" packages/sdk/src/host/chatrecord.ts` - a chat row keeps the name its backend uses, and no backend id.

### Runtime path

```
createChat (or a plugin) -> host names the chat's backend -> spawn(chat backend, ...) -> chat row keeps the backend -> restore spawns the same backend
```

### Gaps

- A session holds one agent, and every chat is spawned with it.
- A chat row does not say which backend serves it, so a restore cannot start the right one.
- A session's config is the schema of one backend; a chat of another backend has keys the session does not have.
- AHP gives a session one `provider`, and a message's `agent` selects within that provider only.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A person's Front and Back are one session with two chats, and the bot provider owns the session | Softov, 2026-10-18, chose "Bot provider owns it" for "Should one person's Front and Back be one session with two chats, served by the bot provider?" | - |
| A Back chat can use another harness than the session's other chats | Softov, 2026-10-18, "even another harness on another chat, right?" | - |

## Resume state

- **Done so far:** draft written 2026-10-18. No tasks yet.
- **Next action:** ask the open questions, then write the tasks.
- **Open questions:**
  1. Who may name a chat's backend - proposed: a plugin only, through a host seam, and not a client's `createChat`.
  2. Where a chat's own config lives - proposed: on the chat, read against its backend's schema, with the session's `scope: 'session'` keys not passed to it.
  3. What a client sees as the chat's provider - proposed: the session's provider, and the chat's backend in `_meta`.
- **Watch out for:** a chat restored after a restart must start with the backend it had, not the session's.
