---
title: A plugin channel filters each action per subscriber
status: accepted
date: 2026-10-10
refs:
  - "[code://.project/decisions/a-role-refuses-at-the-dispatch-boundary.md](a-role-refuses-at-the-dispatch-boundary.md) - the decision that did not filter root state, because `serverSeq` is shared"
  - "[code://packages/sdk/src/host.ts#L586-L610](../../packages/sdk/src/host.ts#L586-L610) - `emit`, one `serverSeq` and one replay buffer per host"
  - "[code://packages/sdk/src/host.ts#L520-L556](../../packages/sdk/src/host.ts#L520-L556) - `seenBy`, the per-connection hook a send already goes through"
---

## Context

A bot catalogue shows each reader only the bots that reader may read.
The host has one `serverSeq` and one replay buffer, shared by every connection.
[A role refuses at the dispatch boundary](a-role-refuses-at-the-dispatch-boundary.md) did not filter root state, because the next root action would show a filtered client the whole state.

## Decision

For now, a plugin publishes each action with a test of who may see it.
The host keeps the test with the envelope, and calls it with the subscriber's principal at each send and at each replay.
A subscriber that fails the test does not get the envelope, and sees a gap in `serverSeq`.

## Consequences

A catalogue action carries one record, so a dropped action shows nothing that a later action shows again.
Root state is not changed by this decision.
A client must accept a gap in `serverSeq` on a plugin channel.
The protocol lets a server skip sequence numbers on a channel, because `serverSeq` is per host.

## Options

- **One channel per reader.** Rejected for now: a client would subscribe to a URI that names a person. The host would keep one snapshot for each person.
- **No filter, with records the reader may not read left out of the snapshot only.** Rejected: the next action would show those records.
