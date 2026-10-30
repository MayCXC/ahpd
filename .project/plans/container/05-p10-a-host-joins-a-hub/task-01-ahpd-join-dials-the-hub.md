---
title: "`ahpd join` dials the hub and keeps the connection"
status: todo
depends: [task-03-a-node-has-a-token.md]
layer: "server"
refs:
  - "[code://packages/server/src/commands/registry.ts](../../../../packages/server/src/commands/registry.ts) - commands declared once"
  - "[code://packages/server/src/commands/run.ts#L1678-L1689](../../../../packages/server/src/commands/run.ts#L1678-L1689) - the stdio host a session is served from"
---

## Objective

`ahpd join <url> --token <t>` opens a control socket to the hub's join door, says the node's ahpd and protocol versions, and for each `open` dials a data socket and pipes it to a local `ahpd --stdio --plugin <each>` started in the node's own working directory, as p9 does for an ssh machine; a directory the hub names is a path on the hub, not on the node.

## Files

- `CREATE: packages/server/src/commands/join.ts` - the command, CLI only.
- `UPDATE: packages/server/src/commands/registry.ts` - registered.
- `CREATE: packages/server/test/join.test.ts`.

## Steps

1. Speak JSON-RPC on the control socket: `node/hello { versions, workdir }` from the node, `node/open { id, plugins, env? }` from the hub.
2. Start each session in the node's `workdir`: the `--workdir` flag of `ahpd join`, or the start directory. `node/open` has no `cwd`.
3. Put in `env` only what p12 sends; p12's open question decides it.
4. Reconnect a dropped control socket with backoff up to a minute.
5. Stop on a refused token or version, and show the hub's sentence.
6. A data socket that closes ends its process; a process that exits closes its socket.
7. One control socket per node and one data socket per session; each session is its own `ahpd --stdio` process, started by one function, `serveSession(open)`, so serving from a running daemon later changes that function only.

## Validation

- `join.test.ts`: the fixture host is started in the node's `--workdir`, whatever the hub's own path is.
- `join.test.ts`: `node/hello` carries the `--workdir`, and a hub that refuses the version stops `ahpd join` with its sentence.
- `join.test.ts`: against a fake hub, `open` starts a fixture host, a frame crosses both ways, closing either end ends the other, and a dropped control socket reconnects.

## Resume
