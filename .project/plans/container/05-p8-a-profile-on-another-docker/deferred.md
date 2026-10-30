---
title: A profile on another server's Docker - deferred
date: 2026-10-02
---

What waits until the clone route has been used.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A libvirt VM on this host sharing the session's folder by virtiofs instead of a clone | Softov, 2026-10-02: "clone everywhere.. but leave open for future case with virtiofs on local libvirt" | [the VM plan's deferred.md](../20261030-1141-a-vm-is-made-on-a-server/deferred.md) |
| A Proxmox LXC container as a machine | a container is not a VM; it would be its own verbs under the `proxmox` runtime | [the VM plan's deferred.md](../20261030-1141-a-vm-is-made-on-a-server/deferred.md) |
| Following host commits in a machine on another Docker | `follow` merges host commits from the host's objects, which a machine on another box does not have; it logs that nothing moved | a later plan, when a session on a box needs it |
| A `clone` machine for a private repository | a key or token in the machine is one everything running there can read; Softov, 2026-10-30: "for now only works on public.. deferred to work on private repositories" | a later plan, with a way to give the machine access that its agent cannot read |
| Bringing back a `clone` machine's work when `origin` is ahead of this host | bring-back measures from the seed commit, which this host does not have until it fetches `origin` | a later plan, when it occurs |
