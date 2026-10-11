---
title: Each automation keeps its 50 newest runs
status: todo
depends: []
layer: "packages/sdk, packages/server"
refs:
  - "[code://packages/sdk/src/automations.ts#L374](../../../../packages/sdk/src/automations.ts#L374) - `memoryAutomations`; host 80 may move it"
  - "[code://packages/sdk/src/host/handshake.ts#L225-L249](../../../../packages/sdk/src/host/handshake.ts#L225-L249) - the capabilities"
---

## Objective

The host advertises `runHistoryLimit: 50`, and the automation store keeps at most 50 ended runs for each automation.

## Files

- `UPDATE: packages/sdk/src/automations.ts:374` - drop the oldest ended runs past 50, or the store file host 80 made.
- `UPDATE: packages/sdk/src/host/handshake.ts:225-249` - advertise the limit.
- `UPDATE: packages/sdk/test/automations.test.ts` - the cases below.

## Steps

1. Find the automation store on main after host 80.
2. Export `RUN_HISTORY_LIMIT = 50` from the sdk.
3. Drop the oldest ended runs past the limit when the store adds a run.
4. Keep every run that has not ended.
5. Advertise `runHistoryLimit: RUN_HISTORY_LIMIT` beside `automations` in the capabilities.

## Validation

- After 55 ended runs, the store lists 50, newest first.
- A running run is never dropped.
- `pnpm exec vitest run packages/sdk packages/server` passes.

## Resume
