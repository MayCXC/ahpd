---
title: A machine with an address is reached by ssh, with this host's own key
status: done
depends: []
layer: "computer"
refs:
  - "[code://packages/computer/src/owners.ts](../../../../packages/computer/src/owners.ts) - a file this plugin keeps in `host.configDir`, the place for the key"
---

## Objective

p9's ssh reach is a function of a destination, a jump and a key.
A VM runtime answers `how`, `nested`, `exec` and `stats` through it.
This host has one key pair for the VMs it makes.

## Files

- `UPDATE: packages/computer/src/ssh.ts` - `sshReach({ destination, port?, identity?, jump?, workdir?, host? })` taken out of `sshRuntime`.
- `CREATE: packages/computer/src/keys.ts` - `machineKey(configDir, keygen = runKeygen)`: makes `computer-ssh/id_ed25519` with `ssh-keygen` the first time, answers both halves' paths; `keygen` is injectable, so a test hands in a fixture and needs no `ssh-keygen`; and `forgetHost(configDir, address)`, which runs `ssh-keygen -R <address> -f <known_hosts>`.
- `CREATE: packages/computer/test/fixtures/ssh-keygen.mjs` - a fake that writes a fixed key pair where it is told.

## Steps

1. Give `ssh` the `-J <jump>` option for a target with a jump.
2. Accept a new host key into a known-hosts file beside the key.
3. Keep the behaviour of p9's ssh machines.
4. Add `forgetHost`, which removes an address from that known-hosts file when its VM goes.

## Validation

- In `computer-ssh.test.ts`, the argv of a reach with a jump has `-J` and the known-hosts options.
- In the same file, the fixture keygen makes the key once.
- `forgetHost` takes a removed VM's address out of the known-hosts file.
- In task 03, a second VM at that address answers.

## Resume

- Done on 2026-10-30.
- `sshReach(program, target)` in `ssh.ts` answers `argv`, `reached`, `how`, `exec`, `stats`, `check` and `hostCommand` for one destination. `sshRuntime` builds one per box, and its tests pass unchanged.
- A target with `knownHosts` gets `StrictHostKeyChecking=accept-new`, `UserKnownHostsFile` and `HashKnownHosts=no`. The file is unhashed, so `ssh-keygen -R` finds an address in it whatever the person's own `HashKnownHosts` says.
- `-J` reaches the jump with the person's own configuration, because `ssh` gives the jump none of the `-o` options.
- `keys.ts`: `machineKey` makes `computer-ssh/id_ed25519` once, and two calls at once share one run. `forgetHost` runs `ssh-keygen -R` on the known-hosts file, and does nothing when the file does not exist yet. Both take a `Keygen`, and `keygenWith` makes one from any program.
- The ssh fixture now reads `-J` and its value.
- Left for task 03: the call to `forgetHost` when a VM is removed. Its test there makes a second VM at the same address.
