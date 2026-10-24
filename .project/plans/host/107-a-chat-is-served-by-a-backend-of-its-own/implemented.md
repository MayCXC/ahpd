---
title: A chat is served by a backend of its own - implemented
date: 2026-10-24
refs:
  - git://e974f671
  - git://980dc638
  - "[code://packages/sdk/src/host/spawn.ts](../../../../packages/sdk/src/host/spawn.ts)"
  - "[code://packages/sdk/test/host-chats.test.ts](../../../../packages/sdk/test/host-chats.test.ts)"
---

A chat keeps the backend that serves it, and every start of that chat uses that backend. A plugin can start a chat on a backend that it names, and a client sees which backend serves a chat.

## What was built

- Task 01: the chat record keeps the backend that serves the chat.
- Task 02: each start path uses the chat's own backend, not the session's backend.
- Task 03: `PluginHost.startChat` starts a chat on a named backend.
- Task 04: `ChatState._meta['ahpd.provider']` names the chat's backend.

## Verified

- Merged in #71 on 2026-10-23, after review.
- CI passed on #71, with `check-windows` and `install-windows`.

## Departures from the plan

- none.

## Left for later

- A chat list in a client cannot show the backend of a Back until AHP adds `_meta` to `ChatSummary`.
