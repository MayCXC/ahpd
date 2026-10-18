---
title: The folder inside a machine is trusted when this host's client trusts the session's folder
status: accepted
date: 2026-10-18
refs:
  - "[code://packages/sdk/src/nested.ts#L824-L836](../../packages/sdk/src/nested.ts#L824-L836) - the proxy pushes `workspaceTrust` for the inside folder before the create"
  - "[code://packages/agent-acp/src/session/opening.ts#L340](../../packages/agent-acp/src/session/opening.ts#L340) - the ACP refusal in a folder nobody trusts"
  - "[code://packages/sdk/src/host/spawn.ts#L695-L706](../../packages/sdk/src/host/spawn.ts#L695-L706) - `trustedBy`, this host's answer for the session's folder"
---

## Context

The host inside a machine reads trust from the client connected to it, which is this host's nested proxy.
The proxy said nothing about trust, so the host inside trusted no folder.
agent-acp refuses an untrusted folder, so every ACP session in every machine was refused.
Found while checking container/05 p9 task 06 on a Debian box, 2026-10-18.

## Decision

When this host's client trusts the session's folder here, the proxy pushes `workspaceTrust` for the one folder the session works in inside the machine.
It is pushed on the same stream before the session is created.
A folder nobody here vouched for vouches for nothing inside.

## Consequences

Trust stays the person's: one rule decides a folder here and the folder it maps to inside.
A person who wants ACP in a machine trusts the session's folder in their client, as they would for a local session.
A client that never pushes trust gets no ACP session in a machine, as it gets none here.

## Options

- The folder the operator named for a machine, such as an ssh box's `workdir`, counts as trusted.
  It lost because anyone who can pick the machine would get ACP there without trusting anything.
  Softov, 2026-10-18, asked "How should a folder inside a machine become trusted for an ACP agent?": "Outer trust travels".
