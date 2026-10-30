---
title: dev02's libvirt has a pool, a network and an image
status: todo
depends: []
layer: "dev02 (by hand)"
refs:
  - https://libvirt.org/manpages/virsh.html - the commands the runtime uses
  - "[code://.project/plans/container/20261030-1141-a-server-says-what-it-can-run/task-04-dev02-is-checked-by-hand.md](../20261030-1141-a-server-says-what-it-can-run/task-04-dev02-is-checked-by-hand.md) - the check that installs libvirt through Softov's hand"
---

## Objective

dev02's libvirt has a storage pool, a network and a cloud image the runtime can use.
`virsh -c qemu+ssh://<dev02>/system list --all` answers from this host.

## Files

- None in the repository; what was configured goes into this task's Resume.

## Steps

1. Read dev02's `server` leaf, and stop until `kvm`, `libvirt` and `libvirtAccess` are ok.
2. Give Softov the commands that start and autostart the `default` pool and the `default` NAT network.
3. Give Softov the commands that put a Debian 13 genericcloud image in the pool.
4. Wait for Softov to say he ran them.
5. From this host, run `virsh -c qemu+ssh://<dev02>/system list --all` and `virt-install --version`.

## Validation

- Both commands answer from this host, and `virt-install` is 3.0 or later, for `--cloud-init`.

## Resume
