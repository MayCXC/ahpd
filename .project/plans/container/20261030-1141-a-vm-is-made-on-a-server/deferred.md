---
title: A VM is made on a server - deferred
date: 2026-10-30
---

What waits until the VM runtimes have been used.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A libvirt VM on this host sharing the session's folder by virtiofs instead of a clone | Softov, 2026-10-02: "clone everywhere.. but leave open for future case with virtiofs on local libvirt" | unplanned |
| A Proxmox LXC container as a machine | a container is not a VM; it would be its own verbs under the `proxmox` runtime | unplanned |
| A VM's last console lines in the sentence of a boot that timed out | reading the console of a VM on a box needs `virsh console` with a terminal, or a serial log file on the box | unplanned |
| A spec's copies, env and attachments in a VM | each needs a write into the VM over ssh, and no session has needed one on a VM yet | unplanned |
