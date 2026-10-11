---
title: The bot manifest names the host's own owner, so a client never builds it
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/bot/src/provider.ts#L161-L184](../../packages/bot/src/provider.ts#L161-L184) - `MANIFEST`, the body a client reads from `ahpd.resourceProviders`"
  - "[code://packages/bot/src/provider.ts#L281-L307](../../packages/bot/src/provider.ts#L281-L307) - `ownerFor`, which fills `root:<hostName>` when nobody is named"
---

## Context

A host bot belongs to the host, as `root:<hostName>`.
ahpapp lets an admin make one, so it must send that owner.
A client does not know the host's name: a person's connection is told `user:<id>`, not the host's key.

## Decision

The bot scheme's manifest gives the host's own owner as a `const` inside the `owner` property, built from `hostName` when the provider starts.
A client reads that value and sends it unchanged.
Source: (defaulted: a client draws only what the host sends).

## Consequences

The manifest is built per provider, not once per module.
A client shows the host choice only when the manifest names the host owner.

## Options

- A shorthand such as a bare `root` owner that the host expands. It lost because every other owner is written in full, and a record would read one way and be written another.
