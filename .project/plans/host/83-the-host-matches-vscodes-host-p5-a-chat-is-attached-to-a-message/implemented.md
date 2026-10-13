---
title: A chat is attached to a message - implemented
date: 2026-10-13
refs:
  - git://ee1570c4
  - "[code://packages/sdk/src/host/sessionmethods.ts](../../../../packages/sdk/src/host/sessionmethods.ts)"
  - "[code://packages/sdk/src/host/chatattachment.ts](../../../../packages/sdk/src/host/chatattachment.ts)"
  - "[code://packages/sdk/test/host-chat-attachment.test.ts](../../../../packages/sdk/test/host-chat-attachment.test.ts)"
---

A person types `#chat:` in a message and picks another chat of the same session. The agent gets a pointer to that chat and an excerpt of its transcript up to the turn that was picked, as in VS Code.

## What was built

- [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts) - `#chat:` completions: the other chats of the session, newest first, filtered by the typed text.
- [`code://packages/sdk/src/host/chatattachment.ts`](../../../../packages/sdk/src/host/chatattachment.ts) - the pointer and the excerpt that a `chat` attachment becomes.
- `lifecycle.ts`, `chatactions.ts` and `spawn.ts` send the pointer on every way a message reaches a backend.

## Verified

- The gates and vitest passed at the commits, `302a95b0` and `ee1570c4`.
- On a second daemon from main, 2026-10-13, with claude and haiku:
- `#chat:` in a session with three chats gives the two other chats, newest first, each with its completed turn as `endTurn`. `#chat:pel` gives only the chat that matches.
- A chat answered a word that is not in its title. From another chat, with that chat attached and no tool call, the agent gave the word.
- The claude transcript holds the pointer to `get_session_context` and the excerpt. The turn's state keeps the original attachment.

## Departures from the plan

- none.

## Left for later

- `ahpc prompt` does not take a chat URI, so this was checked over the protocol, not in ahpc.
