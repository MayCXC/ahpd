---
title: Make a Proxmox VM on a real node
plans:
  - plans/container/20261030-1141-a-vm-is-made-on-a-server/plan.md
---

# Make a Proxmox VM on a real node

Task 06 of the VM plan. The Proxmox runtime passes its tests against a fake API, and has not met a real node yet.
The check needs a Proxmox VE node that this workstation reaches on port 8006.
This workstation must also reach the node's VM network, directly or through a box in `ssh.machines`.

## Steps

1. Name the node, its storage for VM disks, and its bridge, for example `pve`, `local-lvm` and `vmbr0`.
2. On the node, make a template VM called `ahpd-template` from the Debian 13 cloud image.
3. Give the template a cloud-init drive, and install `qemu-guest-agent` in it.
4. Make a user for ahpd: `pveum user add ahpd@pve`.
5. Give it the VM role on the node: `pveum aclmod / -user ahpd@pve -role PVEVMAdmin`.
6. Give it the storage: `pveum aclmod /storage/local-lvm -user ahpd@pve -role PVEDatastoreUser`.
7. Give it the bridge: `pveum aclmod /sdn/zones/localnetwork -user ahpd@pve -role PVESDNUser`.
8. Make its token: `pveum user token add ahpd@pve ahpd --privsep 0`, and keep the secret it prints.
9. Put the secret in the vault of a test ahpd, from standard input: `ahpd vault set host:proxmox`.
10. If the node's certificate is its own, copy `/etc/pve/pve-root-ca.pem` from the node to this workstation.

## Reply

Write the node's address, its storage, its bridge, and the path of the CA file. Write nothing of the secret.
I then make a VM from a profile with `runtime: "proxmox"` and run a turn in it.
Then I suspend, resume and remove it, and check that its disk is gone.
