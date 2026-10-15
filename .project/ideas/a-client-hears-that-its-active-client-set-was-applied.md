---
title: A client hears that its active client set was applied
created: 2026-10-14
---

A client sends `session/activeClientSet` and waits for its `clientSeq` to come back.
When the announcement changes nothing, it waits forever.
This host sends no action for a change that is not one ([`code://docs/sdk/AHP.md`](../../docs/sdk/AHP.md), "An action that changes nothing is not a change").
A backend that cannot apply the set is not refused either; `retool` never refuses.

A receipt would answer both, behind an `ahpd.` capability.
The host echoes an unchanged announcement to its sender only, with the current `serverSeq`, and refuses a set the backend cannot apply.

This goes against the silence rule, which was made after a loop of 300 round trips between a client and this host.
Before a plan, record whether a client really waits on its `clientSeq` here, and weigh it against that loop.
An echo to the sender must not reach the other clients.
