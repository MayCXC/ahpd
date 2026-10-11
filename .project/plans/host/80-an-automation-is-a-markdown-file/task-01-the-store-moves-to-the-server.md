---
title: The store moves to the server
status: todo
depends: []
layer: "packages/sdk, packages/server"
refs:
  - "[code://packages/sdk/src/index.ts#L64](../../../../packages/sdk/src/index.ts#L64) - the export of `scheduledAutomations`"
  - "[code://packages/server/src/commands/run.ts#L654-L661](../../../../packages/server/src/commands/run.ts#L654-L661) - the one caller"
---

## Objective

`scheduledAutomations` is in `packages/server/src/scheduled.ts`, and it behaves as before.
The sdk exports `memoryAutomations` and the port, and no clock store.

## Files

- `DELETE: packages/sdk/src/scheduled.ts` - it moves to the server.
- `CREATE: packages/server/src/scheduled.ts` - the same store, moved with `git mv`.
- `UPDATE: packages/sdk/src/index.ts:64` - remove the export of `scheduledAutomations` and `ScheduledOptions`.
- `UPDATE: packages/server/src/commands/run.ts` - import the store from `../scheduled.js`.
- `DELETE: packages/sdk/test/scheduled.test.ts` - it moves to `packages/server/test/scheduled.test.ts`.
- `CREATE: packages/server/test/scheduled.test.ts` - the moved test.
- `UPDATE: packages/sdk/test/trigger-types.test.ts` - move the cases that need the clock to the server test, or use `memoryAutomations`.
- `UPDATE: packages/sdk/test/host-close.test.ts` - the same.
- `UPDATE: packages/sdk/test/automations.test.ts` - the same.
- `UPDATE: docs/LIBRARY.md:48-81` - show `memoryAutomations`, and say that the clock store is the daemon's.

## Steps

1. Move `scheduled.ts` and `scheduled.test.ts` with `git mv`.
2. Change the imports in the moved files to `@ahpd/sdk`.
3. Remove the two exports from `packages/sdk/src/index.ts`.
4. Change each sdk test that uses the clock store to use `memoryAutomations`, or move the case to the server.
5. Import the store in `run.ts` from the server.
6. Change `docs/LIBRARY.md`.

## Validation

- `rg -n "scheduledAutomations" packages/sdk` finds nothing.
- `pnpm exec vitest run packages/sdk packages/server` passes with the same number of cases as before.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume
