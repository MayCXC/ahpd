---
title: A client adds to the agent's system prompt
created: 2026-10-14
---

A client may want to give the agent standing instructions for its sessions, such as how to format an answer for its own screen.
`Start.instructions` exists, but only host tools fill it today ([`code://packages/sdk/src/host/tooling.ts`](../../packages/sdk/src/host/tooling.ts), `instructions`).

Two ways:

- **A rule in the client's plugin.** An always-apply `Rule` customization in the plugin a client publishes on `SessionActiveClient.customizations` is added to `Start.instructions`. This is the protocol's own surface, so no new key; the client has to publish a plugin.
- **An ahpd `_meta` key on `createSession`.** The handshake advertises it and `createSession` checks its size. The session record keeps it through a restart, and the session start merges it. Simpler for a client, but it is ahpd's own key and not in the spec.

The first follows the protocol and is the smaller change to this host's design.
