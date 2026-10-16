---
title: The replay buffer has a byte budget
status: todo
depends: [task-02-the-limits-are-host-config-keys.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host.ts#L370-L379](../../../../packages/sdk/src/host.ts#L370-L379) - `REPLAY` and `replayable`"
  - "[code://packages/sdk/src/host.ts#L644-L646](../../../../packages/sdk/src/host.ts#L644-L646) - the clone and the shift"
  - "[code://packages/sdk/src/host/handshake.ts#L463-L490](../../../../packages/sdk/src/host/handshake.ts#L463-L490) - the oldest entry decides between replay and snapshots"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L404](../../../../packages/sdk/src/host/sessionmethods.ts#L404) - another reader of `replayable`"
  - "file:///github/agent-host-protocol/docs/specification/lifecycle.md - a gap past the buffer gets snapshots"
---

## Objective

The replay buffer drops its oldest envelopes while it holds more bytes than `replayBytes`, as it does past its count.

## Files

- `UPDATE: packages/sdk/src/host.ts:370-379` - a running byte total beside `REPLAY`, checked against `replayBytes`.
- `UPDATE: packages/sdk/src/host.ts:644-646` - add the size of a new envelope, and drop the oldest past either limit.
- `UPDATE: packages/sdk/test` - large actions shorten the buffer, and a reconnect past it gets snapshots.

## Steps

1. Keep each envelope's size beside it in `replayable`.
2. Measure the size once, as the length of the envelope's serialised text, when the host buffers it.
3. Add the size to a running total, and subtract it when the buffer drops the envelope.
4. Drop the oldest envelope while the count or the total is past its limit.
5. Read the budget from the reader of task 02 at each push.
6. Keep the newest envelope, even when it is larger than the budget alone.
7. Check that `handshake.ts` and `sessionmethods.ts` read nothing that the new field breaks.
8. Write the tests.
9. Set this task and the plan row to `implemented`.

## Validation

- A test: actions larger than the budget over ten leave fewer than ten envelopes in the buffer.
- A test: a client that reconnects from before the oldest envelope gets snapshots.
- A test: small actions still keep 1000 envelopes.
- `pnpm -s build`, `pnpm -s typecheck` and the vitest gate pass.

## Resume
