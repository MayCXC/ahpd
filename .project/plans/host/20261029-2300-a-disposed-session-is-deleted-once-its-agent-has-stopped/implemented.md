---
title: A disposed session is deleted once its agent has stopped - implemented
date: 2026-10-29
refs:
  - git://5e241f31 - the change
  - "[code://packages/sdk/src/host/lifecycle.ts#L248](../../../../packages/sdk/src/host/lifecycle.ts#L248) - `teardown` answers once every chat's close has settled"
  - "[code://packages/sdk/src/host/lifecycle.ts#L635](../../../../packages/sdk/src/host/lifecycle.ts#L635) - `removeSession` waits for it before it deletes the backend's copy"
---

A disposed session leaves no copy of its conversation behind.
The backend's copy is deleted after every chat's agent has stopped, so what an agent writes as it exits goes with it.

## What was built

- [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - `teardown` collects each chat's close, each failure caught, and answers them.
  `removeSession` awaits the teardown before `deleted`.
- [`code://packages/sdk/test/session-delete.test.ts#L116`](../../../../packages/sdk/test/session-delete.test.ts#L116) - "deletes a running session's copy once its agent has stopped, so what the agent writes as it exits goes too".
  Its agent writes the lines a CLI 2.1.301 wrote as it exited, once the case lets the process exit.

## Verified

- The case fails before the change, with the transcript left after the disposal, and passes after it.
- `session-delete.test.ts` passes, 8 of 8.
- The type check passes.

## Departures from the plan

- none.

## Left for later

- none.
