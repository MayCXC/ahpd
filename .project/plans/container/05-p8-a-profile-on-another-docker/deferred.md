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
