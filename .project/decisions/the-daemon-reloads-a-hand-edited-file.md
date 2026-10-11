---
title: The daemon reloads a bot or an automation file that a person edits
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/bot/src/store.ts](../../packages/bot/src/store.ts) - `botStore`, which reads its files once, at start"
  - "[code://packages/sdk/src/scheduled.ts](../../packages/sdk/src/scheduled.ts) - `scheduledAutomations`, which reads its file once, at start"
---

## Context

Each bot and each automation is a file a person can edit, paste or drop in.
Today the daemon reads its stores once, at start, and its next write replaces an edit that a person made while it ran.

## Decision

The daemon watches the bot folder and the automation folder.
A changed, added or removed file is read again and replaces what the store holds.
A file that cannot be read is reported, and the store keeps the version it had.

Source: Softov, 2026-10-10, to "When you edit, paste or drop in a bot or automation file while the daemon runs, when should it take effect?" - "Live, by watching the folder".

## Consequences

A person installs a bot or an automation by copying one file into the folder.
A client that watches bots or the automation catalogue hears about a hand edit as it hears about any other change.
The store must ignore the events its own writes cause.

## Options

- **Read at the next restart.** Rejected: the running daemon replaces a hand edit with its next write.
