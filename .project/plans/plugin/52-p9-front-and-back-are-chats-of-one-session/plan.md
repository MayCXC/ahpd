---
title: Front and Back are chats of one session
domain: plugin
status: dropped
priority: medium
created: 2026-10-18
revalidated: 2026-10-18
requires:
  - plans/plugin/52-p3-a-message-wakes-the-bot-and-it-replies/plan.md
  - plans/host/107-a-chat-is-served-by-a-backend-of-its-own/plan.md
changes:
  - specs/bots.md
creates: []
refs:
  - "[code://packages/bot/src/wake.ts#L202-L215](../../../../packages/bot/src/wake.ts#L202-L215) - `sessionFor`, the request a Back session is started from today"
  - "[code://packages/bot/src/wake.ts#L272-L310](../../../../packages/bot/src/wake.ts#L272-L310) - `sessionNamed`, one Back session for each bot, person and name"
  - "[code://packages/bot/src/chat.ts#L436](../../../../packages/bot/src/chat.ts#L436) - `botChatAgent`, the provider of the Front"
  - "[code://packages/bot/src/post.ts#L44-L80](../../../../packages/bot/src/post.ts#L44-L80) - `post_message`, the Back's reply to the Front"
---

Dropped 2026-10-22: merged into [p14 - A bot session has a Front, Backs and wakes](../52-p14-a-bot-session-has-a-front-and-backs/plan.md).

## Goal

One person's talk with a bot is one session with two or more chats.
The Front is the chat where the person and the bot talk.
The Back is a chat where a harness does the work, and the bot can have more than one Back.
Maria and Pedro talking to Ello are two sessions, and each has a Front and a Back.
A client shows the Back next to the Front, and not as a separate session in the list.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "backs\." packages/bot/src` - the plugin keeps a row for each Back session, keyed by bot, person and name.

### Runtime path

```
person -> Front chat (bot-chat provider, no model) -> wake -> Back chat of the same session (a harness) -> post_message -> Front
```

### Gaps

- A Back is a session of its own, with no link to the Front in the protocol.
- The session list shows the Front and the Back as two unrelated rows.
- A chat of a session cannot be served by a harness, which host/107 adds.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A person's Front and Back are one session with two chats, and the bot provider owns the session | Softov, 2026-10-18, chose "Bot provider owns it" for "Should one person's Front and Back be one session with two chats, served by the bot provider?" | - |
| The chat where the person talks to the bot is the Front, and the harness chat is the Back | Softov, 2026-10-18, "Lets call the part where we send message to the bot Front. and with harness the Back." | - |
| A Back chat can use another harness than another Back chat | Softov, 2026-10-18, "even another harness on another chat, right?" | - |

## Resume state

- **Done so far:** draft written 2026-10-18. No tasks yet. This plan replaces a separate link between a Front session and a Back session.
- **Next action:** finish host/107, ask the open questions, then write the tasks.
- **Open questions:**
  1. What happens to the Back sessions that exist - proposed: no migration; a new message starts a Back chat.
  2. Is a Back chat `read-only` or `full` for the person - proposed: `read-only`, so the person talks only in the Front.
  3. A wake with no person behind it - proposed: it stays a new session for each fire, with its own Back chat.
- **Watch out for:** the Front's history must outlive a change of the Back's harness, because the Front is the bot provider's chat.
