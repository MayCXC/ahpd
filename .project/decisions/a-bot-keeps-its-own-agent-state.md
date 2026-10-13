---
title: A bot keeps its own agent state, and its owner pays for the machine
status: accepted
date: 2026-10-13
refs:
  - "[code://packages/computer/src/runtime.ts#L122-L140](../../packages/computer/src/runtime.ts#L122-L140) - the state volume name, by profile, owner and provider"
  - "[code://packages/computer/src/plugin.ts#L791-L795](../../packages/computer/src/plugin.ts#L791-L795) - the owner a machine carries"
---

## Context

A machine's agent state, its config and sign-in, is a volume per owner under `stateScope: owner`.
A bot's session has the bot's owner as its owner, so every bot of one person shares one state volume.
Two bots of one person then share one sign-in and one agent memory.

## Decision

For agent state, a bot is an owner of its own, named `bot:<slug>`.
Its state volume is `ahpd-state-<profile>-bot:<slug>-<provider>-<hash>`, with the name made safe for Docker.
The machine is still labelled with the bot's owner, who pays for its up-time.
Source: Softov, 2026-10-13, asked "Whose state (agent config, sign-in) does a bot's machine use?", answered "The bot's own".

## Consequences

Two bots of one person have separate sign-ins and separate memory.
A bot must be signed in once, on its own volume.
`stateScope: shared` still gives every owner, bots too, one volume per provider.

## Options

- **The bot's owner**: rejected; every bot of one person would share one sign-in.
- **The profile decides**: rejected; the answer must be the same for every bot.
