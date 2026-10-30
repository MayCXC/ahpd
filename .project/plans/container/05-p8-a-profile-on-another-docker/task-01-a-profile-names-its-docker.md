---
title: A profile names its Docker, and its machines' ids say which
status: todo
depends: []
layer: "computer"
refs:
  - "[code://packages/computer/src/plugin.ts#L99-L169](../../../../packages/computer/src/plugin.ts#L99-L169) - `profilesOf`"
  - "[code://packages/computer/src/plugin.ts#L551-L567](../../../../packages/computer/src/plugin.ts#L551-L567) - the plugin's own runner"
  - "[code://packages/computer/src/plugin.ts#L633-L644](../../../../packages/computer/src/plugin.ts#L633-L644) - `claimOf`, already through the router"
  - "[code://packages/computer/src/runtime.ts#L885-L907](../../../../packages/computer/src/runtime.ts#L885-L907) - `ran`, which has no timeout"
  - "[code://packages/computer/src/router.ts#L47-L55](../../../../packages/computer/src/router.ts#L47-L55) - the router's one `listTimeout`, which bounds only `list`"
  - "[code://packages/computer/src/plugin.ts#L1113-L1175](../../../../packages/computer/src/plugin.ts#L1113-L1175) - the startup adoption, whose failure is swallowed by `.catch(() => {})`"
  - "[code://packages/computer/src/runtime.ts#L3008-L3061](../../../../packages/computer/src/runtime.ts#L3008-L3061) - `list`, filtered by the plugin label only"
  - "[code://packages/computer/src/runtime.ts#L1030](../../../../packages/computer/src/runtime.ts#L1030) - `ahpd.host`, the daemon's id on a machine made for a session"
---

## Objective

A profile with `server` has its own runner, with `DOCKER_HOST=ssh://<destination>` built from that box.
The runner is registered with p9's router under its own prefix, and listing, inspecting, metering and owning its machines work as for the local Docker.

## Files

- `UPDATE: packages/computer/src/plugin.ts:99-169` - build the Docker address from the profile's `server`; a profile whose Docker address equals the plugin's own Docker (its `env.DOCKER_HOST`, or none when that is unset) is skipped with a line, since its machines would be listed twice.
- `UPDATE: packages/computer/src/plugin.ts:551-567` - one `dockerRuntime` per profile with `server`, after `requireOn(server, ['docker', 'dockerAccess'])`, `env: { ...env, DOCKER_HOST }`, `remote: true`, registered with the router.
- `UPDATE: packages/computer/src/plugin.ts:1113-1175` - the startup adoption logs one line naming each Docker that did not answer and tries that runner again at the next listing, rather than `.catch(() => {})`.
- `UPDATE: packages/computer/src/runtime.ts` - `DockerOptions.profile`: the listing adds `--filter label=ahpd.profile=<key>` when set; every machine a remote runner makes carries the existing `ahpd.host` label, and its listing filters on it, so two hosts sharing one remote Docker do not list each other's machines.
- `UPDATE: packages/computer/src/router.ts:47-55` - a per-runner timeout on every call it routes, in place of one `listTimeout` for `list` only, so a hung `ssh://` Docker answers as a Docker that did not answer.
- `UPDATE: packages/computer/test/computer-disposable.test.ts`, `computer-uptime.test.ts`.

## Steps

1. Build `ssh://<destination>` from the box, with the port in the address when the box sets one.
2. Refuse a Docker profile whose box sets `identity`.
3. Make the refusal say to name the key in ssh's own configuration.
4. For now the id is `docker-<profile>.<name>`, written and read through p9 task 01's `spellMachineId` and `parseMachineId`, never by hand; a profile named like a served runtime value is refused at load.
5. A machine made from such a profile is made by its runner, carries `ahpd.profile=<key>`, and is watched and metered by `made`.
6. A runner whose Docker does not answer, or does not answer within the router's per-runner timeout, leaves its machines out of a listing and logs one line naming the Docker; the listing and the picker answer with the rest. `ran` itself has no timeout, so the bound is the router's, one value per runner, on every call.
7. At startup, a runner whose listing fails is logged by name and its adoption is tried again at the next listing; the other runners' machines are adopted.

## Validation

- A box with `port: 2222` gives `DOCKER_HOST=ssh://<destination>:2222`.
- The plugin refuses a Docker profile whose box sets `identity`, with the sentence.
- With the fake Docker and a profile `far` with `server` naming a fake box, a disposable machine is made by a run whose env holds `DOCKER_HOST`, listed as `docker-far.<name>`, and its stretch is written with its owner.
- Two profiles on the same `server` list only their own machines.
- Two plugins standing for two hosts on one fake Docker each list only the machines carrying their own `ahpd.host`.
- A profile whose Docker address equals the plugin's own Docker is skipped with a line, and the others load.
- A fake Docker that never answers for profile `far` leaves a listing to answer with the local machines after the timeout, naming `far`'s Docker; one that refuses does the same at once.
- A startup listing that fails for `far` logs one line naming it, and `far`'s disposable machines are adopted at the next listing that reaches it.

## Resume
