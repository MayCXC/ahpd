---
title: A bot record stays in the configuration folder, apart from its workspace
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/bot/src/store.ts](../../packages/bot/src/store.ts) - the store the records are kept in"
  - "[code://packages/bot/src/provider.ts](../../packages/bot/src/provider.ts) - `workspaceFor`, which keeps the workspace apart from the record"
---

## Context

A bot has a record and a workspace, and they are two folders.
The record is server data, and the workspace is the folder the bot's session works in.
Softov asked to unify the two.

## Decision

The record stays where the configuration's own store keeps it, apart from the workspace, and nothing moves.

Source: Softov, 2026-10-10, to "Where should a bot's record file live?" - "on config", because bots are server records that a database could keep later.

## Consequences

The record is never in the bot's own working folder, so the agent cannot edit its own owner or instructions there.
The bot store stays a port that a database can replace.

## Options

- **The record beside the workspace, with the session under it.** Rejected: every existing workspace must move, and its session stays where it is.
- **The record inside the bot's own folder.** Rejected: the record is server data, and it belongs with the configuration.
