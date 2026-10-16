---
title: Each automation keeps its 50 newest runs
status: done
depends: []
layer: "packages/sdk, packages/server"
refs:
  - "[code://packages/sdk/src/automations.ts#L374](../../../../packages/sdk/src/automations.ts#L374) - `memoryAutomations`; host 80 may move it"
  - "[code://packages/sdk/src/host/handshake.ts#L225-L249](../../../../packages/sdk/src/host/handshake.ts#L225-L249) - the capabilities"
---

## Objective

The host advertises `runHistoryLimit: 50`, and the automation store keeps at most 50 ended runs for each automation.

## Files

- `UPDATE: packages/sdk/src/automations.ts:374-430` - the limit, the window, and where it is applied.
- `UPDATE: packages/sdk/src/index.ts:63` - export `RUN_HISTORY_LIMIT`.
- `UPDATE: packages/sdk/src/host/handshake.ts:225-260` - advertise the limit.
- `UPDATE: packages/sdk/test/automations.test.ts` - the cases below.
- `UPDATE: packages/sdk/test/host-snapshots.test.ts:409-420` - the capability carries the number.

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

`RUN_HISTORY_LIMIT = 50` is exported from `packages/sdk/src/automations.ts`, and the sdk's index re-exports it. The capability sends that constant as `runHistoryLimit`, so the number a client is told is the number the store keeps.

The window is applied where the history moves and not where it is read. A run is `pending` when the store records it, so the window keeps it whatever the count says. A store that trimmed only on the way in kept 51 runs the moment that run ended, which the first case caught. So `trim` runs where a run is added, where one ends, and where a start fails.

A run that the window drops loses its channel with it, because a run is a name a client may read. `runOf` answers nothing about such a run, which is what VS Code's host gives for one its store no longer holds. The cases read the runs by paging the entry, the way a client does.

`packages/server` needed nothing: `scheduled.ts` composes the sdk's `memoryAutomations`.

The cases are `keeps the newest ended runs, and only that many of them` and `never drops a run that has not ended`, both in `automations.test.ts`.

Files changed:

- `packages/sdk/src/automations.ts`
- `packages/sdk/src/index.ts`
- `packages/sdk/src/host/handshake.ts`
- `packages/sdk/test/automations.test.ts`
- `packages/sdk/test/host-snapshots.test.ts`

Also touched by the run of `pnpm exec vitest run packages/sdk packages/server`, which rewrites its own capture: `packages/sdk/test/fixtures/wire.jsonl`. The restore command is denied in this preset, so Softov reverts it if the recording is not wanted.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server --maxWorkers=2 --testTimeout=10000` pass.
