---
title: Host records get typed channels and commands beside their resource schemes
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/sdk/src/records.ts](../../packages/sdk/src/records.ts) - the people and policy schemes, served through `resourceRead`"
  - "[code://packages/sdk/src/types/plugin.ts](../../packages/sdk/src/types/plugin.ts) - `registerChannel`, and the place `registerMethod` goes"
  - "https://github.com/microsoft/agent-host-protocol - `resourceRead` in `common/commands.ts` reads content at a URI"
---

## Context

Users, teams, projects, roles, computers and usage reach a client through `resourceList` and `resourceRead`.
The protocol defines `resourceRead` to read content at a URI, such as a file or an image.
A record in it is JSON inside the `data` string, so the wire has no shape for it.
A listing gives names only, so a client reads each record after it.
A usage query packs its range into the URI, and a write replaces the whole content.
The protocol keeps typed state in a channel and typed queries and changes in commands, as `ahp-automations://` does.

## Decision

For now, each of these domains gets a typed `x-` channel for its list and `x-` commands for its queries and changes.
The resource schemes stay beside them, as the bot scheme stays beside `x-ahpd-bots://`.
Usage gets commands only, because it is a query and has no state to subscribe to.

Source: Softov, 2026-10-11, to "What should replace resourceRead for users, teams, projects, roles, computers and usage?" - "Add both, keep resources".

## Consequences

A client that knows the channels reads typed records in one subscribe and hears each change.
A client that knows only the protocol still lists and reads the resource schemes.
Each domain keeps two paths to one store, and both are tested.

## Options

- **Channels and commands, and drop the record schemes once clients move.** Rejected for now: a protocol client that knows no `x-` channel would see nothing.
- **Keep `resourceRead` only.** Rejected: the records stay untyped, and a client reads each record after a listing.
