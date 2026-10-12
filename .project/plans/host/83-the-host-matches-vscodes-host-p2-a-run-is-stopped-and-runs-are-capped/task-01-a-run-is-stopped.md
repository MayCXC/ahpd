---
title: A run is stopped
status: done
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

- `UPDATE: packages/sdk/src/host/actions.ts:613-627` - handle the action.
- `UPDATE: packages/sdk/src/host/automations.ts:195-305` - a function that cancels a run.
- `UPDATE: packages/sdk/src/host/handshake.ts:225-249` - advertise `runCancellation` and rewrite the comment.
- `UPDATE: packages/sdk/test/automations.test.ts` - the cases below.
- `UPDATE: packages/sdk/test/automation-wake.test.ts` - the held wake goes with the run.
- `UPDATE: packages/sdk/test/host-snapshots.test.ts:412-416` - the capability is served, so it is advertised.

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

`cancelRun(run)` is in `packages/sdk/src/host/automations.ts`, and `packages/sdk/src/host/actions.ts` calls it with the channel the dispatch arrived on. The action carries no field, so the channel is what names the run.

Step 2 says to remove a run that waits for a slot from `waiting`, and to settle it as `cancelled`. `waiting` holds one held wake for each automation, and a held wake has no run record yet. The store creates the run only when the wake is released. So there was no run in `waiting` to settle. The code drops the held wake instead, which is the run that waits for a slot. The automation then starts nothing behind the run that was stopped. A run whose sessions are all idle settles at once, because no session of it will ever emit an ending. This reading is what makes the task's own validation pass, and the wake case fails without the drop.

`stillGoing(run, except?)` was taken out of `settleRun`, because the settling of a run and the stopping of one ask the same question.

The two refusal sentences are VS Code's own, read from `agentHostAutomationService.ts`: `Automation run is already terminal: <run>` and `Automation run not found: <run>`.

The cases are `stops a running run, and keeps the session it was running in` and `refuses a run that has ended, and one the host does not hold`, both in `automations.test.ts`, and `stops a run, and the wake waiting behind it goes with it` in `automation-wake.test.ts`. `automation-wake.test.ts` is a second test file, and the plan named only `automations.test.ts`. That file has no store of its own to hold a wake behind a run.

Files changed:

- `packages/sdk/src/host/automations.ts`
- `packages/sdk/src/host/actions.ts`
- `packages/sdk/src/host/handshake.ts`
- `packages/sdk/test/automations.test.ts`
- `packages/sdk/test/automation-wake.test.ts`
- `packages/sdk/test/host-snapshots.test.ts`

Also touched by the run of `pnpm exec vitest run packages/sdk`, which rewrites its own capture: `packages/sdk/test/fixtures/wire.jsonl`. The restore command is denied in this preset, so Softov reverts it if the recording is not wanted.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000` pass.
