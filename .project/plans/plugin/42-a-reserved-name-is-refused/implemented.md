---
title: A reserved name is refused for a scheme and a harness - implemented
date: 2026-10-10
refs:
  - git://build/plugin-42 - the build, not merged yet
  - "[code://packages/sdk/src/validate.ts](../../../../packages/sdk/src/validate.ts) - `reservedName`"
  - "[code://packages/sdk/src/plugins.ts](../../../../packages/sdk/src/plugins.ts) - the two registrations and the fold"
  - "[code://packages/sdk/src/host.ts](../../../../packages/sdk/src/host.ts) - the check on the daemon's own agents"
---

A plugin cannot take a name the host or the protocol already uses, as a harness or as a resource scheme.
A harness and a scheme cannot share one name.

## What was built

- [`code://packages/sdk/src/validate.ts`](../../../../packages/sdk/src/validate.ts) - `reservedName`, which answers why a name is reserved. It covers the prefixes `ahp-`, `ahpd-` and `x-`, the names `file` and `automations`, every entry in `SUBJECTS`, and six schemes a client opens itself.
- [`code://packages/sdk/src/plugins.ts`](../../../../packages/sdk/src/plugins.ts) - `registerAgent` and `registerResourceProvider` throw for a reserved name. The fold drops a harness that a scheme holds, and a scheme that a harness holds, with one problem line. `reservedScheme` is gone.
- [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - `createHost` throws for a daemon agent with a reserved name.
- `docs/PLUGINS.md` has a section "Reserved names", and the two rows in `00-plugin.md` name the check.

## Verified

- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- `pnpm exec vitest run packages` passes.
- `plugin-validate.test.ts` has five new cases. With the cross-check turned off, the clash case fails.

## Departures from the plan

- Task 01 - `reservedName` is in `validate.ts`, not `plugins.ts`. `createHost` calls it too, and `host.ts` imports nothing from `plugins.ts`.
- Task 02 - the fold compares schemes in lowercase too, so `Bot` and `bot` are one scheme.

## Left for later

- none.
