---
title: The sender hears its unchanged set
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/actions.ts#L713-L714](../../../../packages/sdk/src/host/actions.ts#L713-L714) - the silence guard"
  - "[code://packages/sdk/src/host.ts#L746-L757](../../../../packages/sdk/src/host.ts#L746-L757) - `refuse`, the shape of a message to the sender only"
  - "[code://packages/sdk/test/presence.test.ts#L121-L142](../../../../packages/sdk/test/presence.test.ts#L121-L142) - the tests to extend"
---

## Objective

An unchanged `session/activeClientSet` gets an echo with its `origin` to its sender only.
The other clients get nothing, as now.

## Files

- `UPDATE: packages/sdk/src/host.ts:746-757` - a helper beside `refuse` sends an accepted envelope to one peer, under the alias that peer watches.
- `UPDATE: packages/sdk/src/host/actions.ts:713-714` - the guard sends the echo to the sender before it returns.
- `UPDATE: packages/sdk/test/presence.test.ts:121-142` - the sender gets the echo and the other client gets nothing.

## Steps

1. Add a helper beside `refuse` that sends an envelope to one peer at the current `serverSeq`.
2. Do not move `serverSeq`, and do not put the envelope in the replay buffer.
3. Call the helper from the silence guard with the action and the sender's `origin`.
4. Leave `held`, `dispatch` and `retool` unchanged for a changed set.
5. Keep the log of a failed `setTools` in `retool` as it is.
6. Extend the test of the silence with the echo to the sender.
7. Set this task and the plan row to `implemented`.

## Validation

- `presence.test.ts`: an unchanged set gets one echo with its `clientSeq` and the current `serverSeq` on the sender's peer.
- `presence.test.ts`: the second client gets no action for the unchanged set.
- `presence.test.ts`: a changed set still reaches both clients.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
