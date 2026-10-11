---
title: A bot record stays in the configuration folder, apart from its workspace
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/bot/src/store.ts](../../packages/bot/src/store.ts) - `<configDir>/bots/`, where the records are"
  - "[code://packages/bot/src/provider.ts](../../packages/bot/src/provider.ts) - `workspaceFor`, which puts a workspace at `<root>/<slug>`"
---

## Context

A bot has a record in `<configDir>/bots/` and a workspace in `~/.bots/<slug>/`.
Softov asked to unify the two folders.
A workspace is the folder the bot's session works in, and it never moves.

## Decision

A bot record is `<configDir>/bots/<slug>.md`.
The workspace stays at `<root>/<slug>`, and nothing moves.

Source: Softov, 2026-10-10, to "Where should a bot's record file live?" - "on config", because bots are server records that a database could keep later.

## Consequences

The record is never in the bot's own working folder, so the agent cannot edit its own owner or instructions there.
The bot store stays a port that a database can replace.
The two folders stay apart.

## Options

- **`~/.bots/<slug>/bot.md` with the session in `workspace/`.** Rejected: each existing workspace must move, and its linked session works in the old folder.
- **`~/.bots/<slug>.md` beside the workspace folder.** Rejected: the record is server data, and it belongs with the configuration.
