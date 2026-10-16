---
title: A slow client is bounded - implemented
date: 2026-10-16
refs:
  - git://1fed4b68
  - "[code://packages/sdk/src/host/limits.ts](../../../../packages/sdk/src/host/limits.ts)"
  - "[code://packages/sdk/src/rpc.ts](../../../../packages/sdk/src/rpc.ts)"
  - "[code://packages/sdk/src/listen.ts](../../../../packages/sdk/src/listen.ts)"
  - "[code://packages/sdk/src/host.ts](../../../../packages/sdk/src/host.ts)"
---

A client that stops reading no longer grows the daemon's memory without end. When its queue is past `clientQueueBytes`, the host logs a line and closes it, and the other clients go on. The replay buffer also has a byte budget, `replayBytes`, beside its count of 1000. A client that reconnects inside the buffer gets a replay, and one before it gets snapshots.

## What was built

- [`code://packages/sdk/src/rpc.ts`](../../../../packages/sdk/src/rpc.ts) - every wire reports the bytes it still holds, and a send past the limit closes the wire.
- [`code://packages/sdk/src/host/limits.ts`](../../../../packages/sdk/src/host/limits.ts) - the two keys, with 16 MiB and 32 MiB defaults and a 1 MiB floor.
- [`code://packages/sdk/src/host/root.ts`](../../../../packages/sdk/src/host/root.ts) - both keys in the root config schema.
- [`code://packages/sdk/src/listen.ts`](../../../../packages/sdk/src/listen.ts) - `accept` binds each peer to the reader of `clientQueueBytes`.
- [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - the replay buffer weighs each envelope by the length of its JSON, and drops its oldest while either limit is passed.
- [`code://docs/sdk/AHP.md`](../../../../docs/sdk/AHP.md) - the limits, and what the host does with a client that stops reading.

## Verified

- `listen.test.ts`, `rpc.test.ts`, `root-config.test.ts` and `host-handshake.test.ts`. The full vitest run had 290 files and 5205 tests. One test failed, `nested-start.test.ts`, which takes 5.0 to 5.5 s on main and on this branch and passes with a longer timeout.
- `pnpm -s docs:build` passes.

## Departures from the plan

- Task 02 - both keys are `type: 'number'` with the floor in the description, because the protocol's property schema has no `minimum` and no `integer`.
- Task 05 - `AHP.md` has no transport section, so the note on a slow client is under `## Behaviour worth knowing`.

## Left for later

- `docs/sdk/HOST.md` lists the host's own root config keys as two, and names neither `changeWords` nor the two new keys. No task covered that file.
