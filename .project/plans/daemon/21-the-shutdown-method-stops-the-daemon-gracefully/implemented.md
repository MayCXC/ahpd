---
title: The shutdown method stops the daemon gracefully - implemented
date: 2026-10-15
refs:
  - git://14a06840
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts)"
  - "[code://packages/sdk/src/listen.ts](../../../../packages/sdk/src/listen.ts)"
---

A `shutdown` request runs the daemon's way down on every platform, with no signal. The log shows `stopping` and `stopped`, and each open client gets close code 1001 with `the host is stopping`.

## What was built

- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - `diagnostics.shutdown` calls the lifecycle's `shutdown`.
- [`code://packages/sdk/src/listen.ts`](../../../../packages/sdk/src/listen.ts) - the Node, Bun and Deno closes send 1001 and the reason.
- [`code://packages/server/test/shutdown-method.test.ts`](../../../../packages/server/test/shutdown-method.test.ts) - the way down after `shutdown`.

## Verified

- `shutdown-method.test.ts` and `listen.test.ts` pass.
- On Linux, 2026-10-15, at `3cf1dc13`: `shutdown` is answered, the log shows `stopping` and `stopped`, and a client gets 1001.
- On Windows 10 Pro 19045 with Node v24.12.0, 2026-10-15, at `ff1288e0`: the same, and the process and `daemon.json` are gone.

## Departures from the plan

- none.

## Left for later

- none.
