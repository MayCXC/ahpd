---
title: libvirt makes a machine from a template, and destroys it
status: todo
depends: [task-01-dev02s-libvirt-has-a-pool.md, task-02-an-address-is-reached-by-ssh.md]
layer: "computer"
refs:
  - "[code://packages/computer/src/runtime.ts#L3174-L3498](../../../../packages/computer/src/runtime.ts#L3174-L3498) - docker's `run`, the spec it reads"
  - "[code://packages/computer/src/runtime.ts#L3008-L3066](../../../../packages/computer/src/runtime.ts#L3008-L3066) - docker's `list` and `inspect`, the rows to answer"
---

## Objective

`libvirtRuntime` makes a VM as a linked clone of the template with cloud-init, records the spec's owner, team, project, profile, agents and disposability in its `<metadata>`, waits for SSH, lists and inspects only VMs carrying that metadata, and removes a VM with its overlay disk.

## Files

- `CREATE: packages/computer/src/libvirt.ts`.
- `UPDATE: packages/computer/package.json:90-222` - `libvirt` options and `runtime` enum value; registered with the router.
- `UPDATE: packages/computer/src/plugin.ts:99-169` - a libvirt profile calls `requireOn(server, ['kvm', 'libvirt', 'libvirtAccess'])` before a create.
- `CREATE: packages/computer/test/fixtures/virsh.mjs` - a fake `virsh` and `virt-install` keeping domains in a JSON file.
- `CREATE: packages/computer/test/computer-libvirt.test.ts`.

## Steps

1. `run`: `vol-create-as <pool> <name>.qcow2 --format qcow2 --backing-vol <template> --backing-vol-format qcow2`; `virt-install --import --cloud-init user-data=<file>,meta-data=<file> --disk vol=<pool>/<name>.qcow2 --noautoconsole` with the spec's `cpus` and `memory`; `virsh metadata <name> --uri <ns> --key ahpd --set <xml>`.
2. The user-data makes user `ahpd` with this host's public key and nothing else; no secret is ever in user-data.
3. Wait for `virsh domifaddr` to answer an address, then for `ssh ... true`, each bounded; a timeout removes the VM and throws with the last console lines.
4. `remove`: `virsh destroy` then `virsh undefine --remove-all-storage --nvram`, which takes the overlay and never the template.
5. A spec with `mounts` or `folder` is refused, as on another Docker; so is a state need (p6's volume), for now, with a line naming the need: a VM has no Docker volume to mount, and syncing state into it is not planned; the code comes in by p8's `code` route (`bundle` by default, or `clone`), with the copy through `scp`.
6. `remote` is true; the id is `libvirt.<name>`, through p9 task 01's `spellMachineId`; every `virsh` call takes `-c qemu+ssh://<destination>/system`, built from the profile's `server` box; a `libvirt.uri` option wins when set.
7. `hostCommand(id)` answers `['/opt/ahpd/ahpd/bin/ahpd']`, the path the template puts ahpd at, not p9's default `['ahpd']`, which a VM's login `PATH` may not hold; a profile's `host` still wins.

## Validation

- `computer-libvirt.test.ts` with the fake: make, list with owner, inspect, a timeout that cleans up, remove.
- A profile with a state need is refused on libvirt naming the need.
- `nested` for a libvirt machine runs `/opt/ahpd/ahpd/bin/ahpd --stdio`.
- By hand on dev02: a disposable session in a VM answers a turn.

## Resume
