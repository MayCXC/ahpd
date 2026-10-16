---
title: A run is stopped, and runs are capped - implemented
date: 2026-10-11
refs:
  - git://b0f8d12
  - "[code://packages/sdk/src/host/automations.ts](../../../../packages/sdk/src/host/automations.ts)"
  - "[code://packages/sdk/src/automations.ts](../../../../packages/sdk/src/automations.ts)"
---

Stop on a running automation in VS Code's window stops it. The run settles as cancelled, and its sessions stay. Each automation keeps its 50 newest runs, and the host says so with `runHistoryLimit`.

## What was built

- [`code://packages/sdk/src/host/actions.ts`](../../../../packages/sdk/src/host/actions.ts) - `automationRun/cancelRequested`, behind the `automation:cancel` grant.
- [`code://packages/sdk/src/host/automations.ts`](../../../../packages/sdk/src/host/automations.ts) - the cancel: each session's turn is cancelled, or the held wake is dropped, and the run settles as cancelled.
- [`code://packages/sdk/src/automations.ts`](../../../../packages/sdk/src/automations.ts) - `RUN_HISTORY_LIMIT`, which trims only runs that ended.
- [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts) - `runCancellation` and `runHistoryLimit` in the capabilities.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude`: 4013 of 4013 tests pass after the rebase onto main.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Departures from the plan

- Task 01 step 2 - a run that waits for a slot is not in `waiting`, so the host drops its held wake instead. The run settles as cancelled, which is what the step asked for.

## Left for later

- The check by hand: Stop in VS Code's window ends a running automation as cancelled.
