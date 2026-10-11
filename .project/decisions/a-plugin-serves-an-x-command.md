---
title: A plugin serves an x- command with registerMethod
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L631](../../packages/sdk/src/types/plugin.ts#L631) - `registerChannel`, the sibling this mirrors"
  - "[code://packages/sdk/src/host.ts#L1341-L1347](../../packages/sdk/src/host.ts#L1341-L1347) - a method the host does not hold is `-32601`"
  - "[code://.project/proposals/agent-host-protocol-extension-methods.md](../proposals/agent-host-protocol-extension-methods.md) - the protocol has no convention for extension methods"
---

## Context

The computer plugin serves `computer://`, and a change to a computer must travel as a typed command.
A plugin can serve a resource scheme and a channel, but it cannot serve a command.
The domain reference lists `registerMethod` as not planned.

## Decision

For now, a plugin serves a command with `registerMethod(name, method)`.
The name starts with `x-`, and two plugins cannot serve one name.
The method has a grant, and an optional `authorize` that lets in a caller without the grant.
The host lists each served command in `_meta['ahpd.methods']`, as it lists channels in `_meta['ahpd.channels']`.

Source: Softov, 2026-10-11, to "Computers are a plugin, and a plugin cannot add a command today. How should computer changes travel?" - "Build registerMethod".

## Consequences

The computer plugin serves its own commands, and the daemon serves the people, policy and usage commands through the same table.
A client finds every command in `_meta`, and it does not need to know which plugin serves it.

## Options

- **Computers get a channel only, and a change stays on `resourceWrite`.** Rejected: the computer would keep one untyped path that the other domains leave.
