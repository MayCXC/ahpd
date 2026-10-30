---
title: A joined socket is a nested host the proxy talks to
status: todo
depends: [task-01-ahpd-join-dials-the-hub.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/sessions/nested.ts#L112](../../../../packages/sdk/src/sessions/nested.ts#L112) - `NestedHost`"
  - "[code://packages/sdk/src/sessions/nested.ts#L156](../../../../packages/sdk/src/sessions/nested.ts#L156) - `NestedOptions.start`"
  - "[code://packages/sdk/src/host/spawn.ts#L796-L798](../../../../packages/sdk/src/host/spawn.ts#L796-L798) - `nestedAgent(agent, { plugins, log })`, built only for an agent that runs nested or a machine off this host"
  - "[code://packages/sdk/src/listen.ts#L97-L139](../../../../packages/sdk/src/listen.ts#L97-L139) - the door"
---

## Objective

The hub's listener takes a node's control and data sockets at a join path.
The node registry answers `connect(node, asked)` with a `NestedStarted`.
It holds the data socket as a `NestedHost`, and the node's workdir from `node/hello`.
The host gives it to `nestedAgent` as `start`.

## Files

- `CREATE: packages/sdk/src/nodes.ts` - the registry: who is connected, `open`, the `NestedHost` wrapper (a line out is one socket message, a message in is a line, `kill` closes, a close is `exit`).
- `UPDATE: packages/sdk/src/listen.ts:97-139` - a join path whose token is checked against nodes, not people; it does not ask for the deployment token, since a node's own token is that door's credential and opens nothing else (task 03).
- `UPDATE: packages/sdk/src/types/computers.ts` - `ComputerPort.connect?`, which returns `NestedStarted | undefined`.
- `UPDATE: packages/sdk/src/host/spawn.ts:796-798` - `nestedAgent(agent, { start })` when the port has `connect`.
- `CREATE: packages/sdk/test/nodes.test.ts`.

## Steps

1. The `NestedHost` type moves to `types/computers.ts` so the port can name it; `nested.ts` re-exports it.
2. `connect` answers `undefined` for an id that is not a node, and the host falls back to `startInside`.
3. Refuse a `node/hello` from an ahpd older than 0.14.1, with a sentence that says to update it.
4. A node that is not connected throws "node <name> is not connected", which the proxy reports as the session's failure.

## Validation

- `nodes.test.ts`: a fake node over an in-memory socket serves a scripted inner host; a nested session through `connect` answers a turn.
- A join with a node token and no deployment token is admitted at the join path; the deployment token alone is refused there.
- `nodes.test.ts`: the inner `createSession` gets the node's workdir, not the hub's folder.
- `nodes.test.ts`: the hub refuses a `node/hello` from 0.14.0 with the update sentence.

## Resume
