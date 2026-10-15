---
title: A docker machine may run under gVisor - implemented
date: 2026-10-12
refs:
  - git://9e870773
  - "[code://packages/computer/src/manifest.ts](../../../../packages/computer/src/manifest.ts)"
  - "[code://packages/computer/src/runtime.ts](../../../../packages/computer/src/runtime.ts)"
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md)"
---

A docker profile can name an OCI runtime, such as `runsc` for gVisor. Every machine made from that profile runs under it. A client cannot name it or change it.

## What was built

- [`code://packages/computer/src/manifest.ts`](../../../../packages/computer/src/manifest.ts) - `Profile.ociRuntime`. `manifestOf` takes it from the profile alone, refuses a body that names it, and refuses a dev container machine from a profile that names it.
- [`code://packages/computer/src/runtime.ts`](../../../../packages/computer/src/runtime.ts) - `MachineSpec.ociRuntime`, and the one argument `--runtime=<value>` on `docker run` when it is set.
- [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts) - `profilesOf` keeps the field, and the profile schema declares it.
- [`code://docs/plugins/COMPUTERS.md`](../../../../docs/plugins/COMPUTERS.md) - a Profiles paragraph with an example, and a Security paragraph on what gVisor adds.

## Verified

- `pnpm exec vitest run packages/computer`: 430 of 430 tests pass.
- New cases in `computer.test.ts`, `computer-plugin.test.ts` and `computer-options-schema.test.ts`. The plugin case reads the real `docker run` argv from the fixture.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.

## Departures from the plan

- The flag test is in `computer-plugin.test.ts`, because the fake runtime in `computer.test.ts` has no argv. `computer.test.ts` asserts the field on the spec.
- `computer-options-schema.test.ts` gained the field, because the profile schema must declare every field that `profilesOf` reads.

## Left for later

- Nothing.
