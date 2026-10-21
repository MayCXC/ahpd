---
title: An ssh machine runs a nested host - implemented
date: 2026-10-19
refs:
  - git://1803784f
  - https://github.com/softov/ahpd/pull/7
  - https://github.com/softov/ahpd/actions/runs/39139099567
  - "[code://packages/computer/src/ssh.ts](../../../../packages/computer/src/ssh.ts) - the ssh runtime"
  - "[code://packages/computer/src/router.ts](../../../../packages/computer/src/router.ts) - the router over several runtimes, and the spelling of a machine id"
---

A box that runs ahpd is listed in the computer plugin's options as an ssh machine, and `computer://ssh.<name>` names it.
A session there runs `ahpd --stdio` on the box over ssh, whatever its agent.
The plugin serves several runtimes at once, and a machine id says which runtime it belongs to.

## What was built

- [`code://packages/computer/src/router.ts`](../../../../packages/computer/src/router.ts) - `spellMachineId`, `parseMachineId` and `routed`. A listing keeps the rows of each runtime that answered, and logs one line for each that threw or hung.
- [`code://packages/computer/src/ssh.ts`](../../../../packages/computer/src/ssh.ts) - `sshRuntime`, `quote` and the `/proc` probe. Every verb is one `ssh -T -o BatchMode=yes` call, with the directory and variables written into the remote command.
- [`code://packages/computer/src/runtime.ts`](../../../../packages/computer/src/runtime.ts) - each runtime answers `remote`, `how`, `hostCommand`, `state`, `agents`, `owner` and `parts`. No caller reads Docker's `inspect` record for these.
- [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts) - the `ssh` option with `pollSeconds`, the router in `made`, and the listing meter charged to `root:<host>`. It refuses a vault-named value for a machine off this host.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - a session nests when its backend runs nested or the port says the machine is `remote`.
- [`code://packages/sdk/src/sessions/nested.ts`](../../../../packages/sdk/src/sessions/nested.ts) - a close with `stopping` leaves the inner session to resume. Only a session removal and a chat removal send `disposeSession`.
- Task 06's run fixed the box's folder URI and the trust of a folder inside a machine. It also fixed `--plugin` options and Windows console windows.
- [`code://docs/plugins/COMPUTERS.md`](../../../../docs/plugins/COMPUTERS.md) - the "ssh machines" section: the option, the fields, the id, a policy glob and what the box needs.

## Verified

- PR 7, CI run 39139099567 on Linux, at head `a1678df2`. `check` ran the boundary, `pnpm typecheck` and `pnpm test:unit`: 326 files, 5566 passed, 1 skipped. `processes` ran `pnpm test:processes`: 35 files, 619 passed. Together they are `pnpm test`.
- `check-windows` failed in that run. It had `continue-on-error` then, and the computer suite failed 144 cases on Windows with and without this branch.
- `packages/computer/test/computer-runtimes.test.ts`: `spells an id with its runtime, and reads back the runtime and the name`, `keeps the rows of a runtime that answered when another threw or hung`, and `charges the host for a machine a listing runtime found up and then gone`.
- `packages/computer/test/computer-ssh.test.ts`: the fixture, `quote`, the listing, `exec`, `stats`, the refusals, the timer, `writes the box own directory and the variables into the remote command, and never this host path`, and `refuses a command in the box when a value there is the vault own, and writes none of it`.
- `packages/sdk/test/nested-start.test.ts`: `nests a session in a machine the port says is off this host`.
- `packages/sdk/test/nested-proxy.test.ts`: `a nested session whose folders change starts the host inside again, and disposes nothing` and `a nested chat a client removes is disposed inside the machine`.
- `packages/sdk/test/nested-process.test.ts`: `a resumed session continues the transcript the inner host kept under its id`.
- Task 06, by hand on 2026-10-18: cofold, pi, Claude and Pi (ACP) each answered a turn on `ssh.deb`. A cofold session kept its conversation over `ahpd restart`. No command line on this host held a key, and the box's up time was written in stretches charged to the host.

## Departures from the plan

- The box was `ssh.deb`, a Debian 13 VM, not dev02. dev02's name did not resolve from the Windows host.
- Task 01 validation bullet 8 has no test: no case makes one runtime's `inspect` throw at `stopping` and checks that the other stretches are written. The code closes each stretch in its own `try`.
- Each runtime also answers `parts()`, and ssh mounts none. Task 06 found that every agent with a part need was refused on the box.
- `how` and `hostCommand` were built in task 02, not task 03, because the runtime is not whole without them.
- The vault check also runs in the plugin's `exec`, because a terminal reaches the box through `exec` and not `how`.
- Two more closes pass `stopping`: a sleep and a chat moved to another session. A resume follows each of them.
- Pi (ACP) from the web UI is refused as untrusted, because `@ahpd/web` 0.4.0 pushes no trust. A script client that pushes trust got an answer.

## Left for later

- The end-to-end case through the ssh fixture, and four reads of Docker's record - see [deferred.md](deferred.md).
- Console windows from other spawns on a Windows daemon belong with daemon/33.
