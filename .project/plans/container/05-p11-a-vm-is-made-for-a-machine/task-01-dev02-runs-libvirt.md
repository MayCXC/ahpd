---
title: dev02 runs libvirt and qemu
status: todo
depends: []
layer: "dev02 (by hand)"
refs:
  - https://libvirt.org/manpages/virsh.html - the commands the runtime uses
---

## Objective

dev02 has libvirt, qemu and a storage pool and network the runtime can use, and `virsh -c qemu+ssh://softov@dev02.example.com/system list --all` answers from this host.

## Files

- None in the repository; what was installed and configured goes into this task's Resume.

## Steps

1. Softov's step, as root on dev02: `apt install libvirt-daemon-system qemu-system-x86 qemu-utils virtinst cloud-image-utils`; add `softov` to the `libvirt` group. dev02 has `/dev/kvm` and Docker already, and no libvirt yet; wait for Softov to say this is done.
2. The `default` pool and the `default` NAT network, started and autostarted.
3. A Debian 13 genericcloud image in the pool, to build the first template from.
4. From this host: `virsh -c qemu+ssh://... list --all` and `virt-install --version` (3.0 or later, for `--cloud-init`).

## Validation

- The two commands above answer from this host.

## Resume
