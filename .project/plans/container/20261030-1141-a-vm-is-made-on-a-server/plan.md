---
title: A VM is made on a server
domain: container
status: active
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
requires:
  - plans/container/05-p3-parts-are-built-from-one-versions-file/plan.md
  - plans/container/05-p8-a-profile-on-another-docker/plan.md
  - plans/container/05-p9-an-ssh-machine-runs-a-nested-host/plan.md
  - plans/container/20261030-1141-a-server-says-what-it-can-run/plan.md
changes: []
creates: []
decisions:
refs:
  - git://57a4a716 - the last commit where these tasks were tasks 08 to 13 of p8
  - "[code://packages/computer/src/runtime.ts#L531-L669](../../../../packages/computer/src/runtime.ts#L531-L669) - `ComputerRuntime`, which each VM maker implements"
  - "[code://packages/computer/src/runtime.ts#L3358-L3393](../../../../packages/computer/src/runtime.ts#L3358-L3393) - the records a docker machine keeps as labels, which a VM keeps in its own metadata"
  - "[code://packages/computer/src/plugin.ts#L785-L911](../../../../packages/computer/src/plugin.ts#L785-L911) - `made`, the router that usage/03 wraps to meter up time"
  - "[code://packages/computer/package.json#L90-L222](../../../../packages/computer/package.json#L90-L222) - `optionsSchema`; a credential is `writeOnly` (daemon/11)"
  - "[code://packages/computer/src/provider.ts#L207](../../../../packages/computer/src/provider.ts#L207) - `STATES`, the states a `state` write may ask for"
  - "[code://packages/computer/src/provider.ts#L318-L328](../../../../packages/computer/src/provider.ts#L318-L328) - the `state` leaf"
  - "[code://.project/plans/container/05-p11-a-vm-is-made-for-a-machine/plan.md](../05-p11-a-vm-is-made-for-a-machine/plan.md) - dropped plan whose VM runtimes are here"
  - https://libvirt.org/formatdomain.html#general-metadata - `<metadata>` in a domain, under a namespace of ours
  - https://libvirt.org/manpages/virsh.html - `vol-create-as --backing-vol`, `domifaddr`, `metadata`, `start`, `shutdown`, `suspend`, `resume`, `undefine --remove-all-storage`
  - https://pve.proxmox.com/pve-docs/api-viewer/ - `qemu/{vmid}/clone` with `full=0`, `config` for cloud-init, `status/*`, tags and `description`
---

## Goal

A profile says `runtime: "libvirt"` and `server: "dev02"`, and a machine made from it is a virtual machine on dev02.
The VM is a linked clone of a template, given this host's SSH key by cloud-init, and reached as p9's ssh machine once SSH answers.
It is destroyed with its disk when it goes.
The template is built from p3's `versions.json`, tagged with its hash, and built again when the file changes.
Each VM records its owner in its own metadata, and its up time is metered like a container's.
The code reaches a VM by p8's `code` route, with `scp` in place of `docker cp`.
A profile may instead say `runtime: "proxmox"`, and the Proxmox API makes the VM the same way.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "libvirt|proxmox|virsh" packages` - nothing.
- `ssh` to dev02 (Softov, 2026-10-02) - Debian 13, `/dev/kvm`, 6 cores, 11 GB, Docker, no libvirt, no Proxmox.

### Runtime path

```
disposable:<profile runtime libvirt, server dev02> -> requireOn(dev02, kvm, libvirt, libvirtAccess)
  -> template ahpd-template-<hash> (built once from versions.json)
  -> virsh -c qemu+ssh://<destination>/system vol-create-as --backing-vol (linked clone) -> virt-install --cloud-init (this host's key) --import
  -> metadata: owner, team, project, profile, agents -> wait for ssh -> id libvirt.<name>
session -> p8's code route, copy by scp -> port.remote(id) -> nested over ssh (p9's reach, jumping through the server box) -> the VM's ahpd
remove -> virsh destroy + undefine --remove-all-storage -> stretch written to the owner
```

### Gaps

- No runtime makes a virtual machine.
- No template carries the parts.
- The `state` leaf knows `running`, `stopped` and `restarted`, not `suspended`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The VM work is its own plan, after the server check and the Docker plan | Softov, 2026-10-30: "Three plans: check, Docker, VM" | - |
| A libvirt profile names its box as `server`, and `virsh` runs as `virsh -c qemu+ssh://<destination>/system` from this host | Softov, 2026-10-30: "It names the ssh box"; Softov, 2026-10-03, asked "how is `virsh` run against dev02?": "as proposed" | 03 |
| A libvirt profile is checked for `kvm`, `libvirt` and `libvirtAccess` before a create | Softov, 2026-10-30: "check and print fix commands" | 03 |
| The VM runtime values are `libvirt` and `proxmox` | Softov, 2026-10-02, asked "How is a hypervisor named in a computer profile?": "One runtime per maker" | 03, 06 |
| libvirt first, on dev02; Proxmox second, on a Proxmox node named when tested | Softov, 2026-10-02, asked "Which VM maker comes first?": "libvirt first on dev02" | 01, 03, 06 |
| A made VM is reached as p9's ssh machine | the VM is a box with ahpd on it, which is what p9 reaches | 02 |
| A VM records its owner in its own metadata: libvirt `<metadata>`, Proxmox tags and notes | [A machine is owned by whoever created it, and its owner pays for the time it is up](../../../../docs/sdk/USAGE.md), "The owner is stored with the machine" | 03, 06 |
| A VM's up time is metered by the plugin's wrapper, as for a container | usage/03 | 04 |
| The template is built from `versions.json`, tagged with its hash, and built again when the hash changes | p3's `hashOf` | 05 |
| Start, stop, suspend and resume are offered where the runtime declares them | the `capabilities` resource is where a client learns what a runtime does | 04 |
| The Proxmox API token is a plugin option, `writeOnly` and `secretAtUse`, read with `host.secret` when used; a token that cannot be read fails only the Proxmox runtime | daemon/11; Softov, 2026-10-03, asked "when a `$secret` in a plugin's options can't be read at load, what fails?": "Only its item" | 06 |
| Proxmox is called with `node:https` and its `ca` option, not `fetch` | (defaulted: `fetch` takes no CA without undici, and dependencies are Softov's call) | 06 |
| A removed VM's address is removed from the known-hosts file, and the key maker is injectable | (defaulted: DHCP recycles addresses, and `accept-new` refuses a changed key; a test needs no `ssh-keygen`) | 02 |
| A VM's host command is `/opt/ahpd/ahpd/bin/ahpd` | (defaulted: that is where the template puts it, and a VM's login `PATH` may not hold it) | 03, 05 |
| A state need (p6's volume) is refused on a VM for now, with a line | (defaulted: a VM has no Docker volume, and syncing state into it is not planned) | 03 |
| Code reaches a VM by clone, as on another Docker | Softov, 2026-10-02, asked "How does a session's code reach a machine on another box?": "clone everywhere.. but leave open for future case with virtiofs on local libvirt" | 03 |
| For now a template copies `/opt/ahpd` out of `ahpd-agents:<hash>` into a cloud image booted once with cloud-init, shuts it down and keeps its disk as `ahpd-template-<hash>`; `ensureTemplate` is the one place this is done | Softov, 2026-10-03, asked "how does a template get the parts?": "as proposed" | 05, 06 |
| For now a suspended VM is not up: its stretch closes at suspend and a new one opens at resume | Softov, 2026-10-03, asked "does `suspend` keep the up-time stretch open?": "as proposed" | 04 |
| For now a VM's id is `libvirt.<name>` (and `proxmox.<name>`), through p9 task 01's `spellMachineId` and `parseMachineId` | Softov, 2026-10-03, answered in p9: "put runtime.name" | 03, 06 |
| For now a VM refuses a spec's copies, env and attachments, with a line | (defaulted: nothing writes a file or a variable of this host into a VM yet) | 03 |
| The pool and the network are `default` when the `libvirt` option names none, and a VM's disk is `20G` | (defaulted: a box with libvirt installed has a `default` pool and network) | 03 |
| `virsh` and `virt-install` are options that take a program and its first arguments | (defaulted: a test runs them as node scripts, and an operator may use a wrapper) | 03 |
| The joined image is built on this host's Docker, and its `/opt/ahpd` goes into the helper VM as a tar on the stdin of `ssh` | (defaulted: this host already builds parts there, and the stream writes nothing on this host) | 05 |
| `libvirt.image` names the cloud image's volume that a template backs onto; `libvirt.template` names an operator's own template, used as it is | (defaulted: a box has a cloud image in its pool, and an operator may keep a template of their own) | 05 |
| The template helper installs the joined image's packages, `ca-certificates`, `git` and `ripgrep` | (defaulted: a VM then has what a container has beyond the parts) | 05 |
| libvirt and Proxmox share one VM runtime in `vm.ts`, and each hypervisor gives its verbs as a `VmMaker` | (defaulted: the waits, the reach, the labels and the template steps are the same for both) | 06 |
| A Proxmox VM is a linked clone (`full=0`) of `proxmox.template`, and a template built here is a full clone of `proxmox.image` onto `proxmox.storage` | (defaulted: a template must not depend on the image it was built from) | 06 |
| A Proxmox template and image have the QEMU guest agent, which gives a VM's address | (defaulted: the API has no other way to read a VM's address) | 06 |
| The Proxmox helper installs its packages with `apt-get` over ssh | (defaulted: Proxmox's cloud-init takes no package list) | 06 |
| A Proxmox profile's `server` is optional and names the box that `ssh -J` goes through; the node is not checked over ssh | (defaulted: the node is reached by its API, and only the VM network may need a jump) | 06 |
| A Proxmox VM that does not shut down within the bound is stopped | (defaulted: the same bound as libvirt's) | 06 |
| A Proxmox listing reads each VM's `status/current`, so a suspended VM is not metered as up | (defaulted: `cluster/resources` says `running` for a paused VM) | 06 |

## Proposed architecture

- **VM options** - `options.libvirt = { uri?, pool, network, template?, image?, user?, disk?, virsh?, virtInstall? }`, where `uri` is built from the profile's `server` when absent. `options.proxmox = { url, tokenId, secret (writeOnly), node, storage, bridge, template?, ca? }`. A profile names `runtime`, `server`, `cpus` and `memory`.
- **VM reach** - a VM is an ssh destination (`ahpd@<address>`), found by `virsh domifaddr` or the Proxmox guest agent. Where the VM's network is private, the reach jumps through the server box. p9's ssh reach answers `how` and `nested`.
- **VM key** - one key pair this host makes in its configuration directory for the VMs it makes; its public half goes in by cloud-init.
- **Layer responsibilities** - `@ahpd/computer` only.
- **Source-of-truth files** - `CREATE: packages/computer/src/libvirt.ts`, `CREATE: packages/computer/src/proxmox.ts`, `CREATE: packages/computer/src/template.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - dev02's libvirt has a pool, a network and an image](task-01-dev02s-libvirt-has-a-pool.md) | todo | - |
| [02 - A machine with an address is reached by ssh, with this host's own key](task-02-an-address-is-reached-by-ssh.md) | done | - |
| [03 - libvirt makes a machine from a template, and destroys it](task-03-libvirt-makes-a-machine.md) | doing | 01, 02 |
| [04 - A VM starts, stops, suspends and resumes, and its up time is metered](task-04-lifecycle-and-up-time.md) | done | 03 |
| [05 - A template is built from versions.json](task-05-a-template-from-versions-json.md) | doing | 03 |
| [06 - Proxmox makes a machine the same way](task-06-proxmox-makes-a-machine.md) | doing | 04, 05 |
| [07 - Docs](task-07-docs.md) | done | 03, 06 |

## Risks and tradeoffs

- A VM takes tens of seconds to boot. A disposable profile on a VM runtime says so in its description. The wait for SSH is bounded, and its failure gives the console's last lines.
- A linked clone depends on its template. A template is never removed while a VM backs onto it, and a new hash makes a new template beside the old one.
- Proxmox answers TLS with a self-signed certificate. The option takes a CA file, passed to `node:https`; pinning a fingerprint is not planned.
- This host cannot reach the VM's private network. The ssh reach jumps through the server box, with the account that `virsh` already uses.

## Resume state

- **Done so far:** tasks 02, 04 and 07, and the code of tasks 03, 05 and 06. These tasks were tasks 08 to 13 of p8 until 2026-10-30.
- **Next action:** the PR for the code and the docs. The checks by hand of tasks 03 and 05 on dev02 wait on task 01, and task 01 waits on Softov's hand in [pending/vm-01-dev02-libvirt.md](../../../pending/vm-01-dev02-libvirt.md). The check by hand of task 06 waits until Softov names a Proxmox node.
- **Open questions:** none.
- **Watch out for:** p3's `hashOf` is the tag, so a template built before p3 lands has no name. A libvirt on this host could share the folder by virtiofs instead of a clone, which is left open, see [deferred.md](deferred.md).

## Final verification checklist

- [ ] A disposable session on a libvirt profile on dev02 answers a turn, and its commit reaches this host's repository as a branch.
- [ ] A VM is metered for its owner, and a suspend closes its stretch.
- [ ] A removed VM leaves no disk behind, and its template stays.
