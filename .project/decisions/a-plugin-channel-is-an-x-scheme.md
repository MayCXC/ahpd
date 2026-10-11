---
title: A plugin channel is an x- scheme, and its actions are x- types
status: accepted
date: 2026-10-10
refs:
  - "[code://.project/research/how-a-host-advertises-a-resource-scheme.md#L53](../research/how-a-host-advertises-a-resource-scheme.md#L53) - the protocol reserves `x-` for extension channel schemes, methods and action types"
  - "[code://packages/sdk/src/plugins.ts#L105-L115](../../packages/sdk/src/plugins.ts#L105-L115) - the reserved scheme check"
---

## Context

A plugin channel is a channel the protocol does not define.
The protocol reserves the `x-` prefix for extension channel URI schemes, command methods, notification methods and action types.
This host names its own `_meta` keys with `ahpd.`.

## Decision

For now, a plugin channel scheme starts with `x-`, and only `registerChannel` may take one.
Its action types start with the channel's scheme, such as `x-ahpd-bots/added`.
The bot catalogue is `x-ahpd-bots://`.

Source: Softov, 2026-10-10, to "For now, what scheme should the bot catalogue channel use?" - "x-ahpd-bots://".

## Consequences

A client that respects the prefix knows the channel and its actions are an extension.
A later protocol channel cannot take the name, because the protocol does not give out `x-` names.
A harness and a resource scheme may not start with `x-` - plan [plugin/42](../plans/plugin/42-a-reserved-name-is-refused/plan.md).

## Options

- **`ahpd-bots://`.** Rejected for now: it is outside the protocol's extension space, so a later protocol channel could take the same name.
