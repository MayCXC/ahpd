---
title: A host joins another, which lists it as a computer and relays its sessions - implemented
date: 2026-10-30
refs:
  - git://06e6b926
  - "[code://packages/sdk/src/nodes.ts](../../../../packages/sdk/src/nodes.ts)"
  - "[code://packages/server/src/commands/join.ts](../../../../packages/server/src/commands/join.ts)"
  - "[code://packages/computer/src/node.ts](../../../../packages/computer/src/node.ts)"
---

A box behind NAT now joins an ahpd hub with a token of its own.
The hub lists it as `computer://node.<name>` and runs sessions on it over a socket the box dialled.
Each session is one more data socket, held by the existing nested proxy as a `NestedHost`.
A turn, a tool call and a stop are therefore frames this host already speaks.
No port is opened on the node, and removing a node refuses its token and drops its connection.
A restart of either side leaves the sessions to resume.
The node re-dials with a backoff.
A session then resumes on its next turn, or reopens on the socket the node dials, as the `nodeRestart` option says.

## What was built

- [`code://packages/sdk/src/nodes.ts`](../../../../packages/sdk/src/nodes.ts) - the registry: `joined()`, `connect(id, asked)` with a ten-second wait for a node that is dialling again, `watch` and `drop`, and `fileNodes` over the file beside the users file.
- [`code://packages/sdk/src/listen.ts`](../../../../packages/sdk/src/listen.ts) - the join path on the listener, where a node's own token is the only credential and an ahpd older than 0.14.1 is refused.
- [`code://packages/sdk/src/access/users.ts`](../../../../packages/sdk/src/access/users.ts) - the `node` grant subject, `node:read` and `node:write`.
- [`code://packages/sdk/src/sessions/nested.ts`](../../../../packages/sdk/src/sessions/nested.ts) - `NestedOptions.restart`, the `halted` state beside `ended`, `reopen`, and the `resuming` flag that subscribes to the inner session instead of making it again.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - `nodeRestart` passed to `nestedAgent`, and [`code://packages/sdk/src/types/host.ts`](../../../../packages/sdk/src/types/host.ts) for the option itself.
- [`code://packages/server/src/commands/join.ts`](../../../../packages/server/src/commands/join.ts) - `ahpd join`: hello with the versions and workdir, one `ahpd --stdio` per session piped to its data socket, and a re-dial with a backoff of up to a minute.
- [`code://packages/server/src/commands/nodes.ts`](../../../../packages/server/src/commands/nodes.ts) - `ahpd node list|add|rm`, the token shown once and kept as a hash.
- [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts), [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts) and [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - the `nodeRestart` daemon option, default `end`.
- [`code://packages/computer/src/node.ts`](../../../../packages/computer/src/node.ts) - the `node` runtime: a connected node is listed as `running`, and every verb that would make, start, stop or reach into a machine of it is refused.
- [`code://docs/plugins/COMPUTERS.md`](../../../../docs/plugins/COMPUTERS.md) - a *Joined nodes* section, with the worked example from `ahpd node add` to a session on the node.
- [`code://docs/sdk/USERS.md`](../../../../docs/sdk/USERS.md) - the `node` row, and the count of host subjects at fifteen.

## Verified

- `pnpm exec tsc -p tsconfig.json --noEmit` prints nothing.
- `pnpm -s schema` writes 508 definitions, and `pnpm -s boundary` reports no undeclared dependency.
- `packages/sdk/test/nodes.test.ts` - 9 passed: the registry against a fake node, a second hub resuming the first hub's session from the same store, both `nodeRestart` values, and the bounded wait.
- `packages/server/test/join.test.ts` - 7 passed, all against the real program in another process: the hello and workdir, a session served in that folder, a session socket closing with its host and the reverse, a version refusal, the re-dial after a control socket drops, a session and its host surviving that drop, a missing token and a refused one.
- `packages/sdk/test/users-host.test.ts` - 18 passed, with `node` among the advertised subjects.
- `packages/server/test/server-commands.test.ts` and `packages/computer/test/computer-plugin.test.ts` - 74 passed.
- `packages/server/test/commandparser.test.ts`, `server-root-config.test.ts` and `config-check.test.ts` - 128 passed, so the new daemon option takes its place in the schema and the parser.
- The full suite is the reviewer's run: it rewrites `packages/sdk/test/fixtures/wire.jsonl` and is left out of every commit.

## Departures from the plan

- Task 05's `end` is a halt, not an ending: `ended` is left unset, because the host refuses every later action on a session whose `ended()` answers, the resuming turn included. A separate `halted` state shows the failure and lets the next turn reopen the session.
- `HostOptions.nodeRestart` in `packages/sdk/src/types/host.ts`, and the one line in `spawn.ts` that passes it, are files the plan's task 05 did not list. The choice has to reach `nestedAgent`, and no port option does.
- `packages/sdk/test/users-host.test.ts` had two failing cases that task 03 left behind: both lists of host subjects left `node` out. Both now carry it, and the file passes.

## Left for later

- Nothing the plan named waits, see [deferred.md](deferred.md) for what was set aside before it.
- Six files are in the working tree and not in any commit, because `git add` is denied in don't-ask mode: `packages/sdk/src/nodes.ts`, `packages/sdk/test/nodes.test.ts`, `packages/server/src/commands/join.ts`, `packages/server/src/commands/nodes.ts`, `packages/server/test/join.test.ts` and `packages/computer/src/node.ts`.
