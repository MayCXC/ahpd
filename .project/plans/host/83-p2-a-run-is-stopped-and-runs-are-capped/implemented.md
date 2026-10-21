---
title: A run is stopped, and runs are capped - implemented
date: 2026-10-11
refs:
  - git://b0f8d12
  - "[code://packages/sdk/src/host/automations.ts](../../../../packages/sdk/src/host/automations.ts)"
  - "[code://packages/sdk/src/automations/automations.ts](../../../../packages/sdk/src/automations/automations.ts)"
---

Stop on a running automation in VS Code's window stops it. The run settles as cancelled, and its sessions stay. Each automation keeps its 50 newest runs, and the host says so with `runHistoryLimit`.

## What was built

- [`code://packages/sdk/src/host/actions.ts`](../../../../packages/sdk/src/host/actions.ts) - `automationRun/cancelRequested`, behind the `automation:cancel` grant.
- [`code://packages/sdk/src/host/automations.ts`](../../../../packages/sdk/src/host/automations.ts) - the cancel: each session's turn is cancelled, or the held wake is dropped, and the run settles as cancelled.
- [`code://packages/sdk/src/automations/automations.ts`](../../../../packages/sdk/src/automations/automations.ts) - `RUN_HISTORY_LIMIT`, which trims only runs that ended.
- [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts) - `runCancellation` and `runHistoryLimit` in the capabilities.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude`: 4013 of 4013 tests pass after the rebase onto main.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- The check by hand, by Softov on 2026-10-16, on Windows with VS Code 1.141.2: Stop on a running automation ends the run as `cancelled`, and its session stays in the list, idle.

## Departures from the plan

- Task 01 step 2 - a run that waits for a slot is not in `waiting`, so the host drops its held wake instead. The run settles as cancelled, which is what the step asked for.
- The window's Stop sends `chat/turnCancelled` on the run's session, not `automationRun/cancelRequested`.
  The run settled as `cancelled`, but the check by hand found the session drawn as failed.
  After an interrupt the Claude SDK ends the turn with a result of its own, `error_during_execution` with `is_error: true`, and that set the session's error.
  `agent-claude` now marks a turn it stopped as `interrupted`, and the result that follows it is not read as a failure.

## Left for later

- none.
