---
title: A restart of the hub or the node leaves its sessions to resume
status: todo
depends: [task-04-the-hub-lists-a-node.md]
layer: "sdk | server"
refs:
  - "[code://.project/plans/daemon/13-ahpd-restart/plan.md](../../daemon/13-ahpd-restart/plan.md) - `ahpd restart`: quiesce, end agents, resume sessions from the store"
  - "[code://packages/sdk/src/nested.ts#L232](../../../../packages/sdk/src/nested.ts#L232) - `innerSession`, which container/04 task 11 names by the outer id"
---

## Objective

After `ahpd restart` on the hub, a session on a node resumes once the node reconnects.
When the node's `ahpd join` restarts, the hub option `nodeRestart` picks what the session does: `end`, the default, or `reconnect`.

## Files

- `UPDATE: packages/sdk/src/nodes.ts` - `connect` for a node that is reconnecting waits a bounded time for it.
- `UPDATE: packages/sdk/src/nested.ts` - a resumed session reopens through `start` with `resume`, by container/04 task 11.
- `UPDATE: packages/server/src/commands/options.ts` - `nodeRestart: 'end' | 'reconnect'` in `serverFields`, default `end`.
- `UPDATE: packages/sdk/test/nodes.test.ts` - the hub restart and both `nodeRestart` values.
- `UPDATE: packages/server/test/join.test.ts` - the node restart through `ahpd join`.

## Steps

1. Close the hub's data sockets with p9 task 05's `stopping`, so that the close disposes no inner session.
2. Keep no session state on the node: resume from the inner host's store under the node's config directory.
3. End a session with a sentence that names the node when the node does not come back within the bound.
4. Add `nodeRestart` to `serverFields`, with the values `end` and `reconnect` and the default `end`.
5. With `end`, end the session with a sentence when its node's data socket closes.
6. With `end`, resume the session by id on its next turn.
7. With `reconnect`, keep the session and reopen it through the node's new data socket when the node joins again.

## Validation

- `nodes.test.ts`: a session answers a turn, then the hub closes. A second hub resumes it against the same fake node store, with the earlier turn in the snapshot.
- A node that reconnects after its control socket dropped is in the list again under the same id.
- `nodes.test.ts`: with `nodeRestart: 'end'`, a node restart ends the session with a sentence.
- `nodes.test.ts`: with `nodeRestart: 'end'`, the next turn resumes the session with the earlier turn in the snapshot.
- `nodes.test.ts`: with `nodeRestart: 'reconnect'`, a node restart keeps the session, and its next turn answers through the new data socket.

## Resume
