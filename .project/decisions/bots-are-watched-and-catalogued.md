---
title: Bots are watched and catalogued
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/bot/src/provider.ts](../../packages/bot/src/provider.ts) - the bot provider, which gains `watch` and a catalogue"
  - "[code://packages/sdk/src/host/channels.ts#L14](../../packages/sdk/src/host/channels.ts#L14) - `ahp-automations://`, the catalogue this mirrors"
---

## Context

A client learns about bots by `resourceList bot://` and one `resourceRead` per bot.
It hears no change that another client makes.
The protocol has no command that lists bots, because bots are this host's plugin and not part of the protocol.

## Decision

For now, a client learns about bots in two ways.
A `createResourceWatch` on `bot://` or `bot://<slug>` reports which bot URI changed.
A subscribe to `x-ahpd-bots://` gives a snapshot of every bot the reader may read, and actions that carry each added, changed or removed record.

Source: Softov, 2026-10-10, to "For now, how should a client learn about bots and their changes?" - "Both: watch and catalogue".

## Consequences

Any protocol client can watch bots, because the watch is the protocol's own command.
A client that knows the catalogue reads every bot in one subscribe, as it reads automations.
The bot plugin keeps two ways to report one change, and both are tested.
A client that uses the stock library mirror ignores the catalogue until it gains a reducer for it.

## Options

- **The watch only.** Rejected for now: a client reads a bot again for each change, and it lists and reads every bot at start.
- **The catalogue only.** Rejected for now: a protocol client that knows no `x-ahpd-` channel hears nothing.
- **A typed bot command in the protocol.** Not taken now: it needs the protocol repository and each client to change first.
