---
title: A run is stopped
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/actions.ts#L613-L616](../../../../packages/sdk/src/host/actions.ts#L613-L616) - the refusal to replace"
  - "[code://packages/sdk/src/host/automations.ts#L195-L240](../../../../packages/sdk/src/host/automations.ts#L195-L240) - `waiting` and `settleRun`"
  - "[code://packages/sdk/src/host/handshake.ts#L225-L249](../../../../packages/sdk/src/host/handshake.ts#L225-L249) - the capabilities"
---

## Objective

`automationRun/cancelRequested` cancels the active turn of each session in the run, keeps each session, and settles the run as `cancelled`; the host advertises `runCancellation: {}`.

## Files

- `UPDATE: packages/sdk/src/host/actions.ts:613-616` - handle the action.
- `UPDATE: packages/sdk/src/host/automations.ts:195-240` - a function that cancels a run.
- `UPDATE: packages/sdk/src/host/handshake.ts:225-249` - advertise `runCancellation` and rewrite the comment.
- `UPDATE: packages/sdk/test/automations.test.ts` - the cases below.

## Steps

1. Write `cancelRun(run)` in `automations.ts`.
2. Remove a run that waits for a slot from `waiting`, and settle it as `cancelled`.
3. Cancel the active turn of each run session through the path `chat/turnCancelled` takes.
4. Settle the run as `cancelled` when no session of it is still busy.
5. Refuse a run that has ended with the message VS Code's host gives.
6. Call `cancelRun` from the action in `actions.ts`.
7. Advertise `runCancellation: {}` beside `automations` in the capabilities.

## Validation

- A running run ends as `cancelled`, and its session is still listed.
- A waiting run ends as `cancelled` and never starts.
- The host refuses a run that has ended.
- `pnpm exec vitest run packages/sdk` passes.

## Resume
