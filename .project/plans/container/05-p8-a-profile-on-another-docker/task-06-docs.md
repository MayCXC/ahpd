---
title: The docs say how a profile uses another Docker or a VM
status: todo
depends: [task-05-dev02s-docker-runs-a-session.md, task-07-a-profile-may-clone-from-origin.md, task-13-proxmox-makes-a-machine.md]
layer: "docs"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the operator's page"
---

## Objective

`docs/plugins/COMPUTERS.md` says what `dockerHost` does, how it differs from the plugin's `env.DOCKER_HOST`, what a remote machine cannot mount, and how the code gets there and back.
It also says how to set up a libvirt host and a Proxmox node, and what a VM profile looks like.
It says how the template is made, and what a VM costs its owner.

## Files

- `UPDATE: docs/plugins/COMPUTERS.md`.

## Steps

1. One example profile against an `ssh://` Docker.
2. Say what `code: "bundle"` and `code: "clone"` each do, that `bundle` is the default and puts no credential in the box, and that `clone` needs the branch on `origin` and a `gitCredential` named from the vault for a private remote.
3. One libvirt and one Proxmox example.

## Validation

- The option names match `profilesOf`.
- Every VM option named exists in `optionsSchema`.

## Resume
