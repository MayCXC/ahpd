---
title: A client past the limit is closed
status: todo
depends: [task-01-each-wire-reports-what-it-holds.md, task-02-the-limits-are-host-config-keys.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/rpc.ts#L145-L150](../../../../packages/sdk/src/rpc.ts#L145-L150) - `peer.send`"
  - "[code://packages/sdk/src/host.ts#L500-L512](../../../../packages/sdk/src/host.ts#L500-L512) - `broadcast`"
  - "[code://packages/sdk/src/host/handshake.ts#L463-L490](../../../../packages/sdk/src/host/handshake.ts#L463-L490) - the reconnect"
---

## Objective

A send to a client whose queue is past `clientQueueBytes` closes the wire, and the host logs it.
Another client on the same host goes on as before.

## Files

- `UPDATE: packages/sdk/src/rpc.ts:145-150` - check `wire.buffered()` before each send.
- `UPDATE: packages/sdk/src/listen.ts` - pass a limit reader and a log to `createPeer`.
- `UPDATE: packages/sdk/src/host.ts` - give each connection's peer the reader of `clientQueueBytes`.
- `UPDATE: packages/sdk/test/listen.test.ts` - a stalled client is closed, and a second one goes on.

## Steps

1. Give `createPeer` an optional limit reader and an optional log.
2. Before a send, read `wire.buffered()` when the wire has it.
3. Send the frame when the queue is under the limit, whatever the frame's own size.
4. Otherwise log the client and its queue, close the wire, and do not send.
5. Check what a pending request gets when its wire closes, and keep that answer.
6. Read the limit at each send from the reader of task 02, so a pushed value applies at once.
7. Write the tests.
8. Set this task and the plan row to `implemented`.

## Validation

- A test: the peer closes a client that stops reading, once its queue passes the limit.
- A test: a second client on the same host gets every action.
- A test: the closed client reconnects with its last `serverSeq`, and gets a replay or snapshots.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
