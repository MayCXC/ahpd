---
title: A VM starts, stops, suspends and resumes, and its up time is metered
status: todo
depends: [task-03-libvirt-makes-a-machine.md]
layer: "computer"
refs:
  - "[code://packages/computer/src/provider.ts#L207](../../../../packages/computer/src/provider.ts#L207) - `STATES`"
  - "[code://packages/computer/src/provider.ts#L318-L328](../../../../packages/computer/src/provider.ts#L318-L328) - the `state` write"
  - "[code://packages/computer/src/plugin.ts#L633-L644](../../../../packages/computer/src/plugin.ts#L633-L644) - `claimOf`, which must read a VM's owner from its metadata"
  - "[code://packages/computer/src/plugin.ts#L785-L911](../../../../packages/computer/src/plugin.ts#L785-L911) - `made`"
---

## Objective

A runtime may declare `suspend` and `resume` in its capabilities; the `state` leaf accepts `suspended` for such a machine and refuses it for one that does not; `made` meters a VM as it meters a container, and reads its owner through the runtime.

## Files

- `UPDATE: packages/computer/src/runtime.ts:531-669` - optional `suspend(id)` and `resume(id)`.
- `UPDATE: packages/computer/src/provider.ts:207, 318-328` - `suspended` where declared.
- `UPDATE: packages/computer/src/plugin.ts:785-911` - `claimOf` already reads through the router (p9 task 01), and the libvirt runtime answers the owner in the form p9's open question settles; `suspend` and `resume` wrapped so a suspend closes the stretch and a resume opens one, in the one wrapper `made` uses.
- `UPDATE: packages/computer/src/libvirt.ts` - `start`, `stop` (`shutdown`, then `destroy` after a bound), `restart`, `suspend`, `resume`.

## Steps

1. For now a suspended VM is not up: suspend closes the stretch, resume opens a new one.
2. A docker machine's capabilities and `state` answers do not change.

## Validation

- `computer-libvirt.test.ts`: suspend and resume through the `state` leaf; two stretches written to the owner around a suspend.
- `computer-uptime.test.ts` passes unchanged.

## Resume
