---
title: A profile's machines may live on another Docker or in a VM
domain: container
status: planned
priority: medium
created: 2026-09-26
revalidated: 2026-10-22
requires:
  - plans/container/05-p3-parts-are-built-from-one-versions-file/plan.md
  - plans/container/05-p5-agents-run-from-their-parts/plan.md
  - plans/container/05-p7-a-worktree-brings-its-repository/plan.md
  - plans/container/05-p9-an-ssh-machine-runs-a-nested-host/plan.md
changes: []
creates: []
decisions:
refs:
  - "[code://packages/computer/src/plugin.ts#L76](../../../../packages/computer/src/plugin.ts#L76) - the `env` option, which already sets `DOCKER_HOST` for the whole plugin"
  - "[code://packages/computer/src/plugin.ts#L354-L360](../../../../packages/computer/src/plugin.ts#L354-L360) - the one `dockerRuntime`, given that `env`"
  - "[code://packages/computer/src/plugin.ts#L410-L454](../../../../packages/computer/src/plugin.ts#L410-L454) - `made`, the single `dockered` that usage/03 wraps to meter up time"
  - "[code://packages/computer/src/plugin.ts#L403-L412](../../../../packages/computer/src/plugin.ts#L403-L412) - `claimOf`, which reads the owner through `dockered.inspect`"
  - "[code://packages/computer/src/plugin.ts#L142-L175](../../../../packages/computer/src/plugin.ts#L142-L175) - `profilesOf`, where a profile's keys are read"
  - "[code://packages/computer/src/runtime.ts#L325-L341](../../../../packages/computer/src/runtime.ts#L325-L341) - `ran`, whose env carries `DOCKER_HOST`"
  - "[code://packages/computer/src/runtime.ts#L98-L106](../../../../packages/computer/src/runtime.ts#L98-L106) - `MachineSpec.mounts`, host paths a remote Docker does not have"
  - "[code://packages/computer/src/runtime.ts#L152-L159](../../../../packages/computer/src/runtime.ts#L152-L159) - `MachineSpec.folder`, mounted at the same path"
  - "[code://packages/computer/src/runtime.ts#L726-L732](../../../../packages/computer/src/runtime.ts#L726-L732) - `-v` for mounts and the folder, `-e`, `-w`"
  - "[code://packages/computer/src/runtime.ts#L123](../../../../packages/computer/src/runtime.ts#L123) - `MachineSpec.copies`"
  - "[code://packages/computer/src/runtime.ts#L736-L744](../../../../packages/computer/src/runtime.ts#L736-L744) - a copy-in is `create`, `docker cp`, `start`, which works against a remote Docker"
  - git://c81ebe0:.project/ideas/more-computer-runtimes.md - "Working without a mount, and syncing", the clone this plan takes
  - "[code://packages/computer/src/runtime.ts#L194-L212](../../../../packages/computer/src/runtime.ts#L194-L212) - `ComputerRuntime`, which each VM maker implements"
  - "[code://packages/computer/src/runtime.ts#L389-L423](../../../../packages/computer/src/runtime.ts#L389-L423) - the records a docker machine keeps as labels, which a VM keeps in its own metadata"
  - "[code://packages/computer/src/plugin.ts#L70-L108](../../../../packages/computer/src/plugin.ts#L70-L108) - `optionsSchema`; a credential is `writeOnly` (daemon/11)"
  - "[code://packages/computer/src/provider.ts#L156](../../../../packages/computer/src/provider.ts#L156) - `STATES`, the states a `state` write may ask for"
  - "[code://packages/computer/src/provider.ts#L278-L288](../../../../packages/computer/src/provider.ts#L278-L288) - the `state` leaf"
  - "[code://.project/plans/container/05-p11-a-vm-is-made-for-a-machine/plan.md](../05-p11-a-vm-is-made-for-a-machine/plan.md) - dropped plan merged here: the VM runtimes"
  - https://docs.docker.com/engine/security/protect-access/ - `DOCKER_HOST=ssh://user@host`
  - https://libvirt.org/formatdomain.html#general-metadata - `<metadata>` in a domain, under a namespace of ours
  - https://libvirt.org/manpages/virsh.html - `vol-create-as --backing-vol`, `domifaddr`, `metadata`, `start`, `shutdown`, `suspend`, `resume`, `undefine --remove-all-storage`
  - https://pve.proxmox.com/pve-docs/api-viewer/ - `qemu/{vmid}/clone` with `full=0`, `config` for cloud-init, `status/*`, tags and `description`
---

## Goal

A profile names `dockerHost: "ssh://softov@dev02.example.com"`, and its machines are made on that Docker: state volumes and copies live there, and the session's code arrives by clone, because the folder is on this host's disk.
By default the clone is of a bundle this host makes, so no credential reaches the box; a profile may instead have the machine clone from `origin` with a git credential named from the vault.
A session in one runs through a nested host, since its terminals and files are the other box's.
The test is against dev02's Docker.

A profile may instead say `runtime: "libvirt"` or `runtime: "proxmox"`, and a machine made from it is a virtual machine.
The VM is a linked clone of a template, given this host's SSH key by cloud-init, and reached as p9's ssh machine once SSH answers.
It is destroyed with its disk when it goes.
The template is built from p3's `versions.json`, tagged with its hash, and rebuilt when the file moves.
Each VM records its owner in its own metadata, and its up time is metered like a container's.
The code reaches a VM by the same `code` route as another Docker, with `scp` in place of `docker cp`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "DOCKER_HOST|env" packages/computer/src/plugin.ts` - the plugin's `env` option is passed to the one runner, so a global `DOCKER_HOST` works today and treats that Docker as this host's.
- `rg "'-v'" packages/computer/src/runtime.ts` - mounts and the folder are bind mounts, which name this host's paths.
- `rg "libvirt|proxmox|virsh" packages` - nothing.
- `ssh softov@dev02.example.com` (Softov, 2026-10-02) - Debian 13, `/dev/kvm`, 6 cores, 11 GB, Docker, no libvirt, no Proxmox.

### Runtime path

```
profile.dockerHost -> [new] one docker runner per profile, env DOCKER_HOST -> router id docker-<profile>.<name>
session on disposable:<profile> -> create on that Docker: no bind mounts, copies by docker cp
  -> [new] code: bundle (default): git bundle here -> docker cp in -> cloned inside, origin set to the repo's remote
  -> [new] code: clone: git clone <origin> inside, credential by name from the vault
  -> port.remote(id) -> nested: DOCKER_HOST=... docker exec -i <name> ahpd --stdio
  -> the result comes back: git bundle inside -> docker cp out -> fetched into the session's worktree branch

disposable:<profile runtime libvirt> -> libvirt runtime:
  template ahpd-template-<hash> (built once from versions.json)
  -> virsh vol-create-as --backing-vol (linked clone) -> virt-install --cloud-init (this host's key) --import
  -> metadata: owner, team, project, profile, agents -> wait for ssh -> id libvirt.<name>
session -> the code route, copy by scp -> port.remote(id) -> nested over ssh (p9's reach, jumping through the libvirt host) -> the VM's ahpd
remove -> virsh destroy + undefine --remove-all-storage -> stretch written to the owner
```

### Gaps

- The runner always talks to the plugin's one Docker.
- Two Dockers may each hold a container of the same name, and the id does not say which.
- Every mount assumes this host's filesystem.
- Nothing brings a session's code into a machine without a mount, or brings it back.
- No runtime makes a virtual machine.
- No template carries the parts.
- The `state` leaf knows `running`, `stopped` and `restarted`, not `suspended`.

## Decisions locked in

| Decision | Task |
| --- | --- |
| One computer: provider, the runtime named for what makes the machine | 01, 10, 13 |
| [A nested host is used only for a backend that runs nested and for a machine on another host](../05-an-agent-in-a-machine/plan.md) | 04, 09 |
| [A nested session is resumed by resuming the inner transcript by id](../04-a-cofold-session-in-a-computer/plan.md) | 04 |
| [A machine is owned by whoever created it, and its owner pays for the time it is up](../../../../docs/sdk/USAGE.md) | 01, 10, 11 |
| [Secrets live in a vault port, and the host's own vault is a plain file until it is encrypted](../../../../docs/server/REFERENCE.md) | 13 |
| [A secret is named in the host's, a team's or a person's scope](../../../../docs/server/REFERENCE.md) | 13 |

| What | Source | Task |
| --- | --- | --- |
| One plan for another Docker and a VM | Softov, 2026-10-22, chose "proxyUrl in each runtime": "Merge p8 + p11" | - |
| `dockerHost` is a profile option, not a runtime: the machine is still made by Docker | "One computer: provider, the runtime named for what makes the machine", the runtime names what makes the machine | 01 |
| One Docker runner per profile that names `dockerHost`, beside the plugin's own | the single `dockered` at [`code://packages/computer/src/plugin.ts#L354-L360`](../../../../packages/computer/src/plugin.ts#L354-L360) | 01 |
| A remote runner's machines carry a per-host label its listing filters on, and a `dockerHost` equal to the plugin's own Docker is skipped with a line | (defaulted: the plugin label is the same on every host, so two hosts on one Docker would list each other's machines, and one Docker reached twice lists each machine twice) | 01 |
| Every call through the router has a per-runner timeout, and a startup adoption that fails is logged and tried again at the next listing | (defaulted: `ran` has no timeout, so a hung `ssh://` Docker would block the listing and the picker) | 01 |
| A need marked `credential: true` is refused on a remote runner, never copied | (defaulted: a copy puts the host's keys on another box) | 02 |
| The work comes back by a fetch into its own ref and a `merge --ff-only` in the worktree, and a disposable machine whose bring-back failed is kept | (defaulted: git refuses a fetch into a branch checked out in a worktree, and removing the machine would lose the work) | 03 |
| `gitCredential` is `secretAtUse`, read with `host.secret` at create for the machine's owner, and a missing one fails only that create | Softov, 2026-10-03, asked "when a `$secret` in a plugin's options can't be read at load, what fails?": "Only its item" | 07 |
| The plugin's `env.DOCKER_HOST` stays the whole plugin's Docker and is treated as this host's | it works today, and an operator who set it chose that | 01 |
| A machine's id records which Docker made it | two Dockers can hold the same name | 01 |
| The session's code reaches the machine by clone | Softov, 2026-10-02, asked "How does a session's code reach a machine on another box?": "clone everywhere.. but leave open for future case with virtiofs on local libvirt" | 03 |
| A machine on another Docker takes no bind mount; a copy-in still works | `docker cp` streams through the Docker API, a bind mount names a path on the Docker's own host | 02 |
| Every session in such a machine runs nested | [A nested host is used only for a backend that runs nested and for a machine on another host](../05-an-agent-in-a-machine/plan.md) | 04 |
| The test target is dev02's Docker | Softov, 2026-10-02, asked "Which box is the test target?": "ssh to softov@dev02.example.com worked." | 05 |
| Both ways in exist, chosen per profile with `code` (for now the option's name and its two values): `bundle` (default), a git bundle of the session's branch made here, copied in with `docker cp` and cloned inside with `origin` set to the repository's remote, with no credential in the box; and `clone`, the machine cloning from `origin` with a git credential named from the vault as `gitCredential: { "$secret": ... }`; one function picks the route | Softov, 2026-10-03, asked "where does the clone come from and get its credentials?": "Both, a profile option"; "one or another is not a valid choise" | 03, 07 |
| For now this host fetches the work back: a bundle made inside, copied out with `docker cp`, fetched into the session's worktree branch | Softov, 2026-10-03, asked "does the machine push the branch back, or does this host fetch it?": "as proposed" | 03 |
| For now a machine on a profile's Docker is `docker-<profile>.<name>`, spelled and parsed by p9 task 01's functions; a profile named like a runtime value is refused | Softov, 2026-10-03, answered in p9: "put runtime.name" | 01 |
| The VM runtime values are `libvirt` and `proxmox` | Softov, 2026-10-02, asked "How is a hypervisor named in a computer profile?": "One runtime per maker" | 10, 13 |
| libvirt first, on dev02; Proxmox second, on a Proxmox node named when tested | Softov, 2026-10-02, asked "Which VM maker comes first?": "libvirt first on dev02" | 08, 10, 13 |
| A made VM is reached as p9's ssh machine | the VM is a box with ahpd on it, which is what p9 reaches | 09 |
| A VM records its owner in its own metadata: libvirt `<metadata>`, Proxmox tags and notes | [A machine is owned by whoever created it, and its owner pays for the time it is up](../../../../docs/sdk/USAGE.md), "The owner is stored with the machine" | 10, 13 |
| A VM's up time is metered by the plugin's wrapper, as for a container | usage/03 | 11 |
| The template is built from `versions.json`, tagged with its hash, and rebuilt when the hash moves | p3's `hashOf` | 12 |
| Start, stop, suspend and resume are offered where the runtime declares them | the `capabilities` resource is where a client learns what a runtime does | 11 |
| The Proxmox API token is a plugin option, `writeOnly` and `secretAtUse`, read with `host.secret` when used; a token that cannot be read fails only the Proxmox runtime | daemon/11; Softov, 2026-10-03, asked "when a `$secret` in a plugin's options can't be read at load, what fails?": "Only its item" | 13 |
| Proxmox is called with `node:https` and its `ca` option, not `fetch` | (defaulted: `fetch` takes no CA without undici, and dependencies are Softov's call) | 13 |
| A removed VM's address is removed from the known-hosts file, and the key maker is injectable | (defaulted: DHCP recycles addresses, and `accept-new` refuses a changed key; a test needs no `ssh-keygen`) | 09 |
| A VM's host command is `/opt/ahpd/ahpd/bin/ahpd` | (defaulted: that is where the template puts it, and a VM's login `PATH` may not hold it) | 10, 12 |
| A state need (p6's volume) is refused on a VM for now, with a line | (defaulted: a VM has no Docker volume, and syncing state into it is not planned) | 10 |
| Code reaches a VM by clone, as on another Docker | Softov, 2026-10-02, asked "How does a session's code reach a machine on another box?": "clone everywhere.. but leave open for future case with virtiofs on local libvirt" | 10 |
| For now a template copies `/opt/ahpd` out of `ahpd-agents:<hash>` (`docker create` and `docker cp`) into a cloud image booted once with cloud-init, over ssh, shuts it down and keeps its disk as `ahpd-template-<hash>`; Proxmox converts the same VM to a template; `ensureTemplate` is the one place this is done | Softov, 2026-10-03, asked "how does a template get the parts?": "as proposed" | 12, 13 |
| For now a suspended VM is not up: its stretch closes at suspend and a new one opens at resume, in the one wrapper `made` uses | Softov, 2026-10-03, asked "does `suspend` keep the up-time stretch open?": "as proposed" | 11 |
| For now `virsh` runs as `virsh -c qemu+ssh://softov@dev02.example.com/system` from this host, the URI a libvirt option, so the runtime is a command like Docker and nothing of ahpd runs on dev02 but inside the VMs | Softov, 2026-10-03, asked "how is `virsh` run against dev02?": "as proposed" | 08, 10 |
| For now a VM's id is `libvirt.<name>` (and `proxmox.<name>`), through p9 task 01's `spellMachineId` and `parseMachineId` | Softov, 2026-10-03, answered in p9: "put runtime.name" | 10, 13 |

## Proposed architecture

- **Data flow** - `profiles.<key>.dockerHost` -> a `dockerRuntime` with `env.DOCKER_HOST` set -> registered with the router under `docker-<key>`; its listing filters by the plugin label and `ahpd.profile=<key>`, so two profiles on one Docker list disjoint machines.
- **Code** - `codeRouteOf(profile)` picks `bundle` (default) or `clone`; both land the session's branch at the machine's `workdir`, and both come back as a bundle made inside, copied out and fetched into the session's worktree branch, when the session leaves the machine and before a disposable machine is removed.
- **Metering** - `made` wraps the router, so each runner's machines are metered as the local ones; `claimOf` reads through the router.
- **VM options** - `options.libvirt = { uri, pool, network, template?, jump?, user? }` and `options.proxmox = { url, tokenId, secret (writeOnly), node, storage, bridge, template? }`; a profile names `runtime`, `cpus`, `memory`.
- **VM reach** - a VM is an ssh destination (`ahpd@<address>`), found by `virsh domifaddr` or the Proxmox guest agent. Where the VM's network is private, the reach jumps through the libvirt host. p9's ssh reach answers `how` and `nested`.
- **VM key** - one key pair this host makes in its configuration directory for the VMs it makes; its public half goes in by cloud-init.
- **Layer responsibilities** - `@ahpd/computer` only.
- **Source-of-truth files** - [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts), `packages/computer/src/router.ts` (p9), `CREATE: packages/computer/src/libvirt.ts`, `CREATE: packages/computer/src/proxmox.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A profile names its Docker, and its machines' ids say which](task-01-a-profile-names-its-docker.md) | todo | - |
| [02 - A machine on another Docker takes no bind mount](task-02-no-bind-mount-on-another-docker.md) | todo | 01 |
| [03 - The session's code arrives by bundle and returns as a branch](task-03-the-code-arrives-by-clone.md) | todo | 02 |
| [04 - Sessions in a machine on another Docker run nested](task-04-sessions-there-run-nested.md) | todo | 01 |
| [05 - dev02's Docker runs a session](task-05-dev02s-docker-runs-a-session.md) | todo | 03, 04, 07 |
| [06 - Docs](task-06-docs.md) | todo | 05, 07, 13 |
| [07 - A profile may have its machine clone from origin](task-07-a-profile-may-clone-from-origin.md) | todo | 03, vault/01-p1 task 04 |
| [08 - dev02 runs libvirt and qemu](task-08-dev02-runs-libvirt.md) | todo | - |
| [09 - A machine with an address is reached by ssh, with this host's own key](task-09-an-address-is-reached-by-ssh.md) | todo | - |
| [10 - libvirt makes a machine from a template, and destroys it](task-10-libvirt-makes-a-machine.md) | todo | 03, 08, 09 |
| [11 - A VM starts, stops, suspends and resumes, and its up time is metered](task-11-lifecycle-and-up-time.md) | todo | 10 |
| [12 - A template is built from versions.json](task-12-a-template-from-versions-json.md) | todo | 10 |
| [13 - Proxmox makes a machine the same way](task-13-proxmox-makes-a-machine.md) | todo | 11, 12 |

## Risks and tradeoffs

- `ssh://` Docker connections are slow to open - each verb is one `docker` run; a listing across several Dockers runs them in parallel and bounds each.
- The nested host needs ahpd inside the image - the test image installs it as `docs/plugins/COMPUTERS.md` shows; p5's ahpd part replaces that once built, and a part image must then be built on the Docker that mounts it.
- A Docker that is down makes its profile's machines unlisted - the listing says which Docker did not answer rather than failing the whole listing.
- A VM takes tens of seconds to boot. A disposable profile on a VM runtime says so in its description. The wait for SSH is bounded, and its failure gives the console's last lines.
- A linked clone depends on its template. A template is never removed while a VM backs onto it, and a new hash makes a new template beside the old one.
- Proxmox answers TLS with a self-signed certificate - the option takes a CA file, passed to `node:https`; pinning a fingerprint is not planned.
- This host cannot reach the VM's private network. The ssh reach jumps through the libvirt host, with the account that `virsh` already uses.

## Resume state

- **Done so far:** nothing; planned 2026-10-02. p11's VM tasks were merged here on 2026-10-22 as tasks 08 to 13, and its docs into task 06.
- **Next action:** [task-01-a-profile-names-its-docker.md](task-01-a-profile-names-its-docker.md). Task 08 waits on Softov installing libvirt on dev02.
- **Open question (ask before task 03):** a session with `isolation: folder` on a remote profile has no worktree branch of its own, and its folder may have another branch checked out - (a) refuse `isolation: folder` on a remote profile with a sentence, or (b) bring the work back to a side branch named for the session and leave merging to the person?
- **Watch out for:** the `clone` route puts a git credential in the box for the clone command only, and needs the vault (vault/01-p1 task 04) to name it; the `bundle` route needs neither; a git credential helper that asks this host is needed only if an agent must reach the remote itself, and waits until one does; a folder that is not a repository has no clone; it is refused here, and copying it in stays in [the idea](../../../ideas/more-computer-runtimes.md); p7's git directory mount does not apply on another Docker; the box runs with its own harness and configuration, and task 02 refuses a credential need from this host, so no key of this host reaches dev02.
dev02 has `/dev/kvm` and Docker but no libvirt yet.
Softov installs libvirt there (task 08 step 1), before task 08's validation and before any check by hand.
p3's `hashOf` is the tag, so a template built before p3 lands has no name.
A libvirt on this host could share the folder by virtiofs instead of a clone, which is left open, see [deferred.md](deferred.md).

## Final verification checklist

- [ ] A disposable session on a profile with `dockerHost` set to dev02 answers a turn, and its commit reaches this host's repository as a branch, with `code: "bundle"` and with `code: "clone"`.
- [ ] No git credential is in any argv on either host, and none is left in the machine after a `clone` route's clone.
- [ ] A local profile and a dev02 profile list their machines side by side with distinct ids, and both are metered.
- [ ] A profile on another Docker with a bind mount is refused with a sentence.
- [ ] A disposable session on a libvirt profile makes a VM on dev02, and the VM's ahpd answers a turn.
- [ ] The VM is gone a delay after the session.
- [ ] The VM's owner is in its metadata, and its up time is written to that owner.
- [ ] Suspend and resume from the `state` leaf work on libvirt.
- [ ] The same on a Proxmox node.
- [ ] `pnpm test`, `pnpm typecheck` green.
- [ ] `docs/plugins/COMPUTERS.md`, `plans/index.md` updated.
