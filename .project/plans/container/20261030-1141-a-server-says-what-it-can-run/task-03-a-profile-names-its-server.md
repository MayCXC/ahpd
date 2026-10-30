---
title: A profile names its server and is checked first
status: todo
depends: [task-01-the-check-runs-on-a-box.md]
layer: "computer"
refs:
  - "[code://packages/computer/src/plugin.ts#L99-L169](../../../../packages/computer/src/plugin.ts#L99-L169) - `profilesOf`, where a profile's keys are read"
  - "[code://packages/computer/src/manifest.ts#L36-L218](../../../../packages/computer/src/manifest.ts#L36-L218) - `Profile`"
  - "[code://packages/computer/package.json#L132-L184](../../../../packages/computer/package.json#L132-L184) - the `profiles` schema"
---

## Objective

A profile may set `server`, the name of an entry in `ssh.machines`.
`requireOn(server, needs)` runs the check before the first create on that box and refuses the create when a need is missing.
The refusal holds the fix lines.
The Docker plan asks for `docker` and `dockerAccess`, and the VM plan asks for `kvm`, `libvirt` and `libvirtAccess`.

## Files

- `UPDATE: packages/computer/src/manifest.ts:36-218` - `Profile.server`, documented.
- `UPDATE: packages/computer/src/plugin.ts:99-169` - read `server`, and skip a profile that names no known box, with one line.
- `UPDATE: packages/computer/package.json:132-184` - `server` in the `profiles` schema.
- `UPDATE: packages/computer/src/servercheck.ts` - `requireOn(server, needs)`, with the last report of each box kept for 60 seconds.
- `UPDATE: packages/computer/test/computer-servercheck.test.ts` - the cases below.

## Steps

1. Read `server` as a string, and look it up in the boxes of `ssh.machines`.
2. Skip a profile whose `server` names no box, with one line that names the profile and the box.
3. Write `requireOn`, which answers when every need is ok and throws otherwise.
4. Make the thrown sentence name the box and each missing need, followed by each fix line.
5. Keep each box's last report for 60 seconds, and run a fresh check after that.
6. Leave the use of `server` to the Docker plan and the VM plan.
7. Write the tests.

## Validation

- A profile with `server: "dev02"` and a `dev02` box loads.
- The plugin skips a profile with `server: "nope"`, with the line.
- `requireOn` with a fake report without Docker throws a sentence with both Docker fix lines.
- Two calls within 60 seconds run the check once.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
