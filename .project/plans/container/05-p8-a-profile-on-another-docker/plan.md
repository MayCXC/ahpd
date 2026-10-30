---
title: A profile's machines may live on another server's Docker
domain: container
status: active
priority: medium
created: 2026-09-26
revalidated: 2026-10-30
requires:
  - plans/container/05-p3-parts-are-built-from-one-versions-file/plan.md
  - plans/container/05-p5-agents-run-from-their-parts/plan.md
  - plans/container/05-p7-a-worktree-brings-its-repository/plan.md
  - plans/container/05-p9-an-ssh-machine-runs-a-nested-host/plan.md
  - plans/container/20261030-1141-a-server-says-what-it-can-run/plan.md
changes: []
creates: []
decisions:
refs:
  - "[code://packages/computer/src/plugin.ts#L329](../../../../packages/computer/src/plugin.ts#L329) - the `env` option, which already sets `DOCKER_HOST` for the whole plugin"
  - "[code://packages/computer/src/plugin.ts#L551-L567](../../../../packages/computer/src/plugin.ts#L551-L567) - the one `dockerRuntime`, given that `env`"
  - "[code://packages/computer/src/plugin.ts#L785-L911](../../../../packages/computer/src/plugin.ts#L785-L911) - `made`, the router that usage/03 wraps to meter up time"
  - "[code://packages/computer/src/plugin.ts#L633-L644](../../../../packages/computer/src/plugin.ts#L633-L644) - `claimOf`, which reads the owner through the router"
  - "[code://packages/computer/src/plugin.ts#L99-L169](../../../../packages/computer/src/plugin.ts#L99-L169) - `profilesOf`, where a profile's keys are read"
  - "[code://packages/computer/src/runtime.ts#L885-L907](../../../../packages/computer/src/runtime.ts#L885-L907) - `ran`, whose env carries `DOCKER_HOST`"
  - "[code://packages/computer/src/runtime.ts#L318-L327](../../../../packages/computer/src/runtime.ts#L318-L327) - `MachineSpec.mounts`, host paths a remote Docker does not have"
  - "[code://packages/computer/src/runtime.ts#L449-L457](../../../../packages/computer/src/runtime.ts#L449-L457) - `MachineSpec.folder`, mounted at the same path"
  - "[code://packages/computer/src/runtime.ts#L3414-L3477](../../../../packages/computer/src/runtime.ts#L3414-L3477) - `-v` for mounts and the folder, `-e` by name, `-w`"
  - "[code://packages/computer/src/runtime.ts#L347-L355](../../../../packages/computer/src/runtime.ts#L347-L355) - `MachineSpec.copies`"
  - "[code://packages/computer/src/runtime.ts#L3486-L3493](../../../../packages/computer/src/runtime.ts#L3486-L3493) - a copy-in is `create`, `docker cp`, `start`, which works against a remote Docker"
  - "[code://.project/ideas/more-computer-runtimes.md#L21](../../../ideas/more-computer-runtimes.md#L21) - \"Working without a mount, and syncing\", the clone this plan takes"
  - git://57a4a716 - the last commit where the VM tasks were tasks 08 to 13 here
  - "[code://.project/plans/container/20261030-1141-a-vm-is-made-on-a-server/plan.md](../20261030-1141-a-vm-is-made-on-a-server/plan.md) - the VM plan, split from this one"
  - https://docs.docker.com/engine/security/protect-access/ - `DOCKER_HOST=ssh://user@host`
---

## Goal

A profile names `server: "dev02"`, an entry of `ssh.machines`, and its machines are made on that box's Docker.
State volumes and copies live there, and the session's code arrives by clone, because the folder is on this host's disk.
By default the machine clones a bundle this host makes, so no credential reaches the box.
A profile may instead have the machine clone from `origin`, with a git credential named from the vault.
A session in one runs through a nested host, since its terminals and files are the other box's.
The test is against dev02's Docker.
A VM on a server is [its own plan](../20261030-1141-a-vm-is-made-on-a-server/plan.md).

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "DOCKER_HOST|env" packages/computer/src/plugin.ts` - the plugin's `env` option is passed to the one runner, so a global `DOCKER_HOST` works today and treats that Docker as this host's.
- `rg "'-v'" packages/computer/src/runtime.ts` - mounts and the folder are bind mounts, which name this host's paths.
- `ssh` to dev02 (Softov, 2026-10-02) - Debian 13, 6 cores, 11 GB, Docker.

### Runtime path

```
profile.server -> requireOn(server, docker, dockerAccess) -> [new] one docker runner per profile, env DOCKER_HOST=ssh://<destination> -> router id docker-<profile>.<name>
session on disposable:<profile> -> create on that Docker: no bind mounts, copies by docker cp
  -> [new] code: bundle (default): git bundle here -> docker cp in -> cloned inside, origin set to the repo's remote
  -> [new] code: clone: git clone <origin> inside, credential by name from the vault
  -> port.remote(id) -> nested: DOCKER_HOST=... docker exec -i <name> ahpd --stdio
  -> the result comes back: git bundle inside -> docker cp out -> fetched into the session's worktree branch

```

### Gaps

- The runner always talks to the plugin's one Docker.
- Two Dockers may each hold a container of the same name, and the id does not say which.
- Every mount assumes this host's filesystem.
- Nothing brings a session's code into a machine without a mount, or brings it back.

## Decisions locked in

| Decision | Task |
| --- | --- |
| One computer: provider, the runtime named for what makes the machine | 01 |
| [A nested host is used only for a backend that runs nested and for a machine on another host](../05-an-agent-in-a-machine/plan.md) | 04 |
| [A nested session is resumed by resuming the inner transcript by id](../04-a-cofold-session-in-a-computer/plan.md) | 04 |
| [A machine is owned by whoever created it, and its owner pays for the time it is up](../../../../docs/sdk/USAGE.md) | 01 |

| What | Source | Task |
| --- | --- | --- |
| The server check, another Docker and a VM are three plans | Softov, 2026-10-30: "Three plans: check, Docker, VM" | - |
| A profile names its box as `server`, an entry of `ssh.machines`, and its Docker is `DOCKER_HOST=ssh://<destination>` | Softov, 2026-10-30: "It names the ssh box" | 01 |
| A profile with `server` is checked for `docker` and `dockerAccess` before a create, and the refusal holds the fix lines | Softov, 2026-10-30: "check and print fix commands" | 01 |
| A box's port goes in the `ssh://` address, and a box with `identity` is refused for a Docker profile, with a sentence to name the key in ssh's own configuration | (defaulted: `DOCKER_HOST` takes a port but no key file) | 01 |
| `server` is a profile option, not a runtime: the machine is still made by Docker | "One computer: provider, the runtime named for what makes the machine", the runtime names what makes the machine | 01 |
| One Docker runner per profile that names `server`, beside the plugin's own | the single `dockered` at [`code://packages/computer/src/plugin.ts#L551-L567`](../../../../packages/computer/src/plugin.ts#L551-L567) | 01 |
| Every machine a remote runner makes carries the `ahpd.host` label with this host's id, and its listing filters on it; a `server` whose Docker equals the plugin's own Docker is skipped with a line | (defaulted: `ahpd.host` exists at [`code://packages/computer/src/runtime.ts#L1030`](../../../../packages/computer/src/runtime.ts#L1030) but the listing does not filter on it, so two hosts on one Docker would list each other's machines, and one Docker reached twice lists each machine twice) | 01 |
| Every call through the router has a per-runner timeout, and a startup adoption that fails is logged and tried again at the next listing | (defaulted: the router bounds only `list`, with one value for every runtime, at [`code://packages/computer/src/router.ts#L47-L55`](../../../../packages/computer/src/router.ts#L47-L55), and `ran` has no timeout, so a hung `ssh://` Docker would block every other call) | 01 |
| A need marked `credential: true`, a file or a volume seed, is refused on a remote runner, unless the profile gives that need its own value; cofold's `cofoldConfig` and `cofoldState` both carry the mark | Softov, 2026-10-30, chose "File and volume seeds"; `cofoldState` seeds a volume from the same config file at [`code://packages/agent-cofold/src/agent.ts#L785-L789`](../../../../packages/agent-cofold/src/agent.ts#L785-L789) | 02 |
| The work comes back through host/67's bring-back: a bundle on `docker exec`'s stdout, fetched into `refs/ahpd/machines/<machine>/<branch>` and moved by its rules; a machine whose work did not come back is not removed | Softov, 2026-10-30, chose "Reuse host/67's"; [`code://packages/computer/src/runtime.ts#L2455-L2580`](../../../../packages/computer/src/runtime.ts#L2455-L2580) | 03 |
| A session with `isolation: folder` on a remote profile is not refused: a branch the folder is not on moves as a ref, and work that is not a fast-forward waits under `refs/ahpd/machines/<machine>/<branch>` | follows host/67's rules, which Softov chose to reuse on 2026-10-30 | 03 |
| `gitCredential` is `secretAtUse`, read with `host.secret` at create for the machine's owner, and a missing one fails only that create | Softov, 2026-10-03, asked "when a `$secret` in a plugin's options can't be read at load, what fails?": "Only its item" | 07 |
| The plugin's `env.DOCKER_HOST` stays the whole plugin's Docker and is treated as this host's | it works today, and an operator who set it chose that | 01 |
| A machine's id records which Docker made it | two Dockers can hold the same name | 01 |
| The session's code reaches the machine by clone | Softov, 2026-10-02, asked "How does a session's code reach a machine on another box?": "clone everywhere.. but leave open for future case with virtiofs on local libvirt" | 03 |
| A machine on another Docker takes no bind mount; a copy-in still works | `docker cp` streams through the Docker API, a bind mount names a path on the Docker's own host | 02 |
| Every session in such a machine runs nested | [A nested host is used only for a backend that runs nested and for a machine on another host](../05-an-agent-in-a-machine/plan.md) | 04 |
| The test target is dev02's Docker | Softov, 2026-10-02, asked "Which box is the test target?": "ssh to softov@dev02.example.com worked." | 05 |
| Both ways in exist, chosen per profile with `code` (for now the option's name and its two values): `bundle` (default), a git bundle of the session's branch made here, copied in with `docker cp` and cloned inside with `origin` set to the repository's remote, with no credential in the box; and `clone`, the machine cloning from `origin` with a git credential named from the vault as `gitCredential: { "$secret": ... }`; one function picks the route | Softov, 2026-10-03, asked "where does the clone come from and get its credentials?": "Both, a profile option"; "one or another is not a valid choise" | 03, 07 |
| For now this host fetches the work back, and the machine never pushes | Softov, 2026-10-03, asked "does the machine push the branch back, or does this host fetch it?": "as proposed" | 03 |
| A vault-named variable works on a remote Docker: p9's refusal applies only to a runtime that puts variables in a command line, as ssh does | Softov, 2026-10-30, chose "Allow on remote Docker"; `noVaultInline` at [`code://packages/computer/src/plugin.ts#L1296-L1300`](../../../../packages/computer/src/plugin.ts#L1296-L1300) | 04 |
| For now a machine on a profile's Docker is `docker-<profile>.<name>`, spelled and parsed by p9 task 01's functions; a profile named like a runtime value is refused | Softov, 2026-10-03, answered in p9: "put runtime.name" | 01 |

## Proposed architecture

- **Data flow** - `profiles.<key>.server` -> `requireOn` -> a `dockerRuntime` with `env.DOCKER_HOST=ssh://<destination>` -> registered with the router under `docker-<key>`; its listing filters by the plugin label and `ahpd.profile=<key>`, so two profiles on one Docker list disjoint machines.
- **Code** - `codeRouteOf(profile)` picks `bundle` (default) or `clone`; both land the session's branch at the machine's `workdir`, and both come back through host/67's bring-back, when the session leaves the machine and before a disposable machine is removed.
- **Metering** - `made` wraps the router, so each runner's machines are metered as the local ones; `claimOf` reads through the router.
- **Layer responsibilities** - `@ahpd/computer` only.
- **Source-of-truth files** - [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts), `packages/computer/src/router.ts` (p9).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A profile names its Docker, and its machines' ids say which](task-01-a-profile-names-its-docker.md) | done | server check 03 |
| [02 - A machine on another Docker takes no bind mount](task-02-no-bind-mount-on-another-docker.md) | done | 01 |
| [03 - The session's code arrives by bundle and returns as a branch](task-03-the-code-arrives-by-clone.md) | done | 02 |
| [04 - Sessions in a machine on another Docker run nested](task-04-sessions-there-run-nested.md) | todo | 01 |
| [05 - dev02's Docker runs a session](task-05-dev02s-docker-runs-a-session.md) | todo | 03, 04, 07 |
| [06 - Docs](task-06-docs.md) | todo | 05, 07 |
| [07 - A profile may have its machine clone from origin](task-07-a-profile-may-clone-from-origin.md) | todo | 03, vault/01-p1 task 04 |
| [08 - dev02 runs libvirt and qemu](task-08-dev02-runs-libvirt.md) | dropped | - |
| [09 - A machine with an address is reached by ssh, with this host's own key](task-09-an-address-is-reached-by-ssh.md) | dropped | - |
| [10 - libvirt makes a machine from a template, and destroys it](task-10-libvirt-makes-a-machine.md) | dropped | 03, 08, 09 |
| [11 - A VM starts, stops, suspends and resumes, and its up time is metered](task-11-lifecycle-and-up-time.md) | dropped | 10 |
| [12 - A template is built from versions.json](task-12-a-template-from-versions-json.md) | dropped | 10 |
| [13 - Proxmox makes a machine the same way](task-13-proxmox-makes-a-machine.md) | dropped | 11, 12 |

## Risks and tradeoffs

- `ssh://` Docker connections are slow to open - each verb is one `docker` run; a listing across several Dockers runs them in parallel and bounds each.
- The nested host needs ahpd inside the image - the test image installs it as `docs/plugins/COMPUTERS.md` shows; p5's ahpd part replaces that once built, and a part image must then be built on the Docker that mounts it.
- A Docker that is down makes its profile's machines unlisted - the listing says which Docker did not answer rather than failing the whole listing.

## Resume state

- **Done so far:** no task; planned 2026-10-02. Main has parts of tasks 01, 03 and 04 from other plans, checked 2026-10-30. `claimOf` reads through the router, p9 spells the ids, and the router bounds `list`. The `ahpd.host` label exists, host/67 brings work back, and `spawnEnvOf` puts the runtime's `env` in the descriptor. Tasks 08 to 13 moved to [the VM plan](../20261030-1141-a-vm-is-made-on-a-server/plan.md) on 2026-10-30. Tasks 01, 02 and 03 are done (2026-10-30).
- **Next action:** [task-04-sessions-there-run-nested.md](task-04-sessions-there-run-nested.md).
- **Open questions:** none; the `isolation: folder` question is answered by host/67's rules (2026-10-30).
- **Watch out for:** the `clone` route puts a git credential in the box for the clone command only.
It needs the vault (vault/01-p1 task 04) to name it. The `bundle` route needs neither. A folder that is not a repository has no clone, and this plan refuses it.
Copying it in stays in [the idea](../../../ideas/more-computer-runtimes.md). p7's git directory mount does not apply on another Docker. Task 02 refuses a credential need from this host, so no key of this host reaches dev02.

## Final verification checklist

- [ ] A disposable session on a profile with `server: "dev02"` answers a turn, and its commit reaches this host's repository as a branch, with `code: "bundle"` and with `code: "clone"`.
- [ ] No git credential is in any argv on either host, and none is left in the machine after a `clone` route's clone.
- [ ] A local profile and a dev02 profile list their machines side by side with distinct ids, and both are metered.
- [ ] A profile on another Docker with a bind mount is refused with a sentence.
- [ ] `pnpm test`, `pnpm typecheck` green.
- [ ] `docs/plugins/COMPUTERS.md` updated.
