---
title: Sessions in a machine on another Docker run nested
status: todo
depends: [task-01-a-profile-names-its-docker.md]
layer: "computer"
refs:
  - "[code://packages/computer/src/plugin.ts#L1349-L1377](../../../../packages/computer/src/plugin.ts#L1349-L1377) - `nestedHost`"
  - "[code://packages/computer/src/runtime.ts#L2983](../../../../packages/computer/src/runtime.ts#L2983) - Docker's runtime says `remote: false` for every machine"
  - "[code://packages/computer/src/runtime.ts#L3138-L3154](../../../../packages/computer/src/runtime.ts#L3138-L3154) - `spawnEnvOf`, which already puts the runtime's `env` in the descriptor"
  - "[code://packages/computer/src/plugin.ts#L1296-L1300](../../../../packages/computer/src/plugin.ts#L1296-L1300) - `noVaultInline`, which refuses vault-named variables on any machine off this host"
---

## Objective

The port says a machine from a remote runner is `remote`, so every backend runs nested there, and `nested` answers `docker exec -i <name> ahpd --stdio` with that runner's `DOCKER_HOST` in the descriptor's `env`.

## Files

- `UPDATE: packages/computer/src/runtime.ts:803-843` - `DockerOptions.remote`, which the runtime answers as `remote` in place of `false`.
- `UPDATE: packages/computer/src/runtime.ts:1177` - `within` answers nothing for a remote runner.
- `UPDATE: packages/computer/src/plugin.ts:1296-1300` - `noVaultInline` refuses only for a runtime that puts variables in a command line.
- `UPDATE: packages/computer/test/computer-spawn.test.ts`.

## Steps

1. Pass `remote: true` for a profile's runner in task 01.
2. Keep `spawnEnvOf`: it already puts `DOCKER_HOST` in the descriptor.
3. Let a vault-named variable through on a remote Docker, since Docker passes it by name through its API.
4. The inner working directory is the clone's, by container/04 task 14.
5. A restart leaves the session to resume, by p9 task 05.

## Validation

- A remote machine's `nested` descriptor holds `DOCKER_HOST` in `env` and no `-v`-mapped `-w`.
- A remote Docker machine answers `remote` true, and a local one false.
- A command with a vault-named variable runs on a remote Docker machine, and is still refused on an ssh machine.

## Resume
