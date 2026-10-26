---
title: The host starts with no agent
status: implemented
depends: []
layer: sdk, server
refs:
  - "[code://packages/sdk/src/host.ts#L236](../../../../packages/sdk/src/host.ts#L236) - `createHost` throws on an empty agent list"
  - "[code://packages/sdk/src/host.ts#L1384](../../../../packages/sdk/src/host.ts#L1384) - a live fold refuses an empty agent list"
  - "[code://packages/server/src/commands/run.ts#L1531-L1542](../../../../packages/server/src/commands/run.ts#L1531-L1542) - `ahpd start` exits 1"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1698](../../../../packages/sdk/src/host/lifecycle.ts#L1698) - a create for a provider the host lacks is refused with `-32002`"
  - "[code://docs/sdk/BUILD-A-HOST.md#L245](../../../../docs/sdk/BUILD-A-HOST.md#L245) - the docs say a host serves at least one backend"
---

## Objective

`createHost`, a live fold and `ahpd start` take an empty agent list. The daemon starts, logs that no backend is loaded, and serves its channels. An admin then adds an agent or a plugin from a client.

## Files

- `UPDATE: packages/sdk/src/host.ts:236` - remove the throw on an empty agent list.
- `UPDATE: packages/sdk/src/host.ts:1384` - remove the refusal of an empty agent list in `replace`.
- `UPDATE: packages/server/src/commands/run.ts:1531-1542` - keep the line as a log line, and remove `process.exit(1)`.
- `UPDATE: packages/server/test/daemon-backend.test.ts` - the daemon with no backend starts and logs the line.
- `UPDATE: packages/server/test/plugins-channel-stdio.test.ts:35` - correct the comment that says the daemon refuses to start.
- `UPDATE: docs/sdk/BUILD-A-HOST.md:15` - `agents` may be empty.
- `UPDATE: docs/sdk/BUILD-A-HOST.md:245` - a host with no agent starts and refuses each session create.

## Steps

1. Remove the empty-list throw in `createHost`, and keep the `agentsProblem` checks.
2. Remove the empty-list refusal in `replace`, and keep the other refusals.
3. Change the start in `run.ts` to log the no-backend line and go on.
4. Add a case in an sdk host test: a host with no agents answers `initialize` and lists `agents: []`.
5. Add a case: that host answers a session create with `-32002`.
6. Add a case: a fold from no agents to one agent lists the agent.
7. Change `daemon-backend.test.ts` to expect a start, the log line and no exit.
8. Correct the two lines in `BUILD-A-HOST.md`, and keep the computer refusal in `packages/sdk/src/sessions/nested.ts:830`.
9. Run the gates, and set this task and the plan row to `implemented`.

## Validation

- The new host cases and `daemon-backend.test.ts` pass.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.

## Resume
