---
title: A machine on another Docker takes no bind mount
status: done
depends: [task-01-a-profile-names-its-docker.md]
layer: "computer"
refs:
  - "[code://packages/computer/src/runtime.ts#L3414-L3477](../../../../packages/computer/src/runtime.ts#L3414-L3477) - `-v` for mounts and the folder"
  - "[code://packages/computer/src/runtime.ts#L3486-L3493](../../../../packages/computer/src/runtime.ts#L3486-L3493) - copies by `docker cp`"
  - "[code://packages/computer/src/runtime.ts#L2027-L2059](../../../../packages/computer/src/runtime.ts#L2027-L2059) - a state volume is seeded by `docker cp -`, which reaches a remote Docker"
  - "[code://packages/computer/src/manifest.ts#L830-L1206](../../../../packages/computer/src/manifest.ts#L830-L1206) - `manifestOf`, where a body and a profile become a spec"
  - "[code://packages/agent-cofold/src/agent.ts#L785-L797](../../../../packages/agent-cofold/src/agent.ts#L785-L797) - `cofoldState` and `cofoldConfig`, a volume seed and a file that hold provider keys"
  - "[code://packages/sdk/src/types/machine.ts#L28-L55](../../../../packages/sdk/src/types/machine.ts#L28-L55) - `Need`, where the credential mark goes"
---

## Objective

A spec for a remote runner carries no `mounts` and no `folder`; a directory or file need becomes a copy-in where the agent allows it and a refusal where it does not, and the plugin's `mounts` option does not apply.
A need marked as holding credentials is refused on a remote runner rather than copied, since a copy would put the host's keys on another box.
The mark covers a file need and a volume seed: cofold's `cofoldConfig` and `cofoldState`, and Claude's `~/.claude` and `.claude.json` file needs.
p12 task 03 covers copies and env together.

## Files

- `UPDATE: packages/computer/src/manifest.ts` - `ManifestDefaults.remote`: mounts refused with a sentence, `folder` dropped for the clone, directory and file needs turned into `copies`.
- `UPDATE: packages/sdk/src/types/machine.ts:28-55` - `Need.credential?: boolean`, documented as "this need's source holds a credential".
- `UPDATE: packages/agent-cofold/src/agent.ts:785-797` (`cofoldState` and `cofoldConfig`) and `packages/agent-claude/src/claude.ts` (the config dir and `.claude.json` needs) - `credential: true`.
- `UPDATE: packages/computer/test/computer-needs.test.ts`.

## Steps

1. A named volume (p6) and an image mount (p4) are Docker-side and stay.
2. The refusal names the profile and the mount.
3. Treat a volume need's seed as its source: a `credential: true` volume whose seed is the agent's default is refused like a file.
4. A need with `credential: true` whose source is the agent's own default (the host's file) is refused on a remote runner, naming the need and the agent, and is never turned into a copy. A profile that gives that need its own value, a file the operator wrote for that box (a cofold config that points at p12's proxy and holds no key), is copied as any other need.

## Validation

- A profile on another Docker with `mounts` is refused; one with a directory need gets a `docker cp` in the fake's argv and no `-v`.
- A cofold session on a profile on another Docker is refused naming `cofoldConfig`, and no `docker cp` of it is recorded; with the profile's `needs.cofoldConfig` naming another file, that file is copied.
- A cofold session in `state: volume` mode on another Docker is refused naming `cofoldState`, and no seed is copied.

## Resume

- **Done:** 2026-10-30. `manifestOf` reads `profile.server`. It refuses a profile or body mount of a host path, leaves out the plugin's `mounts`, and turns directory and file needs into copies. A need with `hostCredential` is refused, naming the need and its agent.
- **Departure:** the switch is `profile.server` in `manifestOf`, not a `ManifestDefaults.remote` field. A remote `dockerRuntime` also refuses a host-path mount in `run`, as a second guard.
- **Departure:** the spec keeps `folder`, for the workdir and for task 03. A remote runner drops only the folder's bind and the git directory mount.
- **Departure:** `resolveNeeds` sets `ResolvedNeed.hostCredential` on a `credential` need that takes the agent's own default. A state need gets it when it has a seed.
- **Tests:** three tests in [`computer-far-docker.test.ts`](../../../../packages/computer/test/computer-far-docker.test.ts), one in [`machine-needs.test.ts`](../../../../packages/sdk/test/machine-needs.test.ts). [`agent-machine-needs.test.ts`](../../../../packages/sdk/test/agent-machine-needs.test.ts) expects the cofold marks.
