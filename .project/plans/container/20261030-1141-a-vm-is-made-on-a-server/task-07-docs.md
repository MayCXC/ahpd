---
title: The docs say how a profile makes a VM
status: todo
depends: [task-03-libvirt-makes-a-machine.md, task-06-proxmox-makes-a-machine.md]
layer: "docs"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the operator's page"
---

## Objective

`docs/plugins/COMPUTERS.md` says how to set up a libvirt box and a Proxmox node, and what a VM profile looks like.
It says how the template is made, and what a VM costs its owner.

## Files

- `UPDATE: docs/plugins/COMPUTERS.md` - a section on VM profiles.

## Steps

1. Show one libvirt profile that names its `server`, and one Proxmox profile.
2. Say how the runtime builds the template from `versions.json`, and when it builds it again.
3. Say that a suspended VM is not up, so its owner pays only for the time it runs.

## Validation

- Every VM option named exists in `optionsSchema`.

## Resume
