---
title: Any root owner is this host, whatever name follows it
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/bot/src/provider.ts](../../packages/bot/src/provider.ts) - `sameOwner` and `ownerFor`, where a `root:` owner is compared by kind"
  - "[code://packages/server/src/commands/run.ts#L431](../../packages/server/src/commands/run.ts#L431) - the daemon passes the machine's hostname as `hostName`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L441](../../packages/sdk/src/host/lifecycle.ts#L441) - a `root:` actor already passes whatever its name"
---

## Context

The host's own owner is `root:<hostName>`, and `hostName` is the machine's hostname at start.
A renamed machine writes a new name, while bots and sessions on disk keep the old one.

## Decision

Any owner that starts with `root:` is this host.
Owner checks compare two `root:` owners as equal.
A make that names a `root:` owner records `root:<hostName>`, the name the host has now.
Source: Softov, 2026-10-11, asked "How should ahpd keep host-owned bots and sessions stable if the server's hostname changes?", answered "Any root:* is this host".

## Consequences

A rename changes no record, and a host bot still links to a session written under an older name.
Records can show more than one name for the host.
Usage pools still group by the full owner, so a rename starts a new pool for the host.

## Options

- Pin the name in the config on the first start. It lost because the records still hold a name that a reader can change by hand.
