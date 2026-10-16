---
title: A client past the limit is closed
status: done
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

- **Done so far:** built 2026-10-16. `types/rpc.ts` has `Bounding` (a `limit()` read at each send, and an optional `log`), and `createPeer(wire, bounding?)` takes one at construction and keeps it: before a send it reads `wire.buffered?.()`, and past the limit it logs, closes the peer and drops the frame - so a pending request ends as `RpcClosed` rather than at the timeout, and a wire that cannot report its queue is never closed for being behind. `types/listen.ts` has `Bounds` (`clientQueueBytes?: () => number`, `log?`), which `ListenOptions` and `StdioOptions` extend, and `listen.ts` turns it into a `Bounding` once per listener (`boundingOf`) - given to `createPeer` on Bun, Deno and Node, and to the stdio pair. `host.ts`'s `accept` binds the peer it was handed with `limit: () => clientQueueBytes(ctx.rootConfig)` and a `log` that names the connection, because the host is the side that knows root config. Tests: five in `rpc.test.ts` under 'a client that is not reading' (written to at the limit whatever the frame weighs, closed with the queue said, the limit read at each send, a wire that cannot say left alone, a question in flight ending `RpcClosed`), and three in `listen.test.ts` over real sockets - a stalled client closed with its queue named and the close frame in the queue, the client beside it still served, and the closed client reconnecting with its `serverSeq` and answered a replay or snapshots.
- **Next action:** build task 04.
- **Open questions:** none.
- **Watch out for:** a listener's `clientQueueBytes` is not what a host over it closes on: `accept` rebinds the peer with the root config's key, so the listener option is for a listener with no host behind it (the tests use both, one each). The third validation bullet had no file of its own in this task's `Files`, so its test went into `listen.test.ts` with the other two, against a real `createHost` (echo backend, no session needed) - that is also the only test that covers what `accept` binds. `packages/sdk/test/fixtures/wire.jsonl` is dirty again from the runs and needs `git checkout -- packages/sdk/test/fixtures/wire.jsonl`, which is denied in this session.
