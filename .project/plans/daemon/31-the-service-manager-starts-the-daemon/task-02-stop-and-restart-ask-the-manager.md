---
title: Stop and restart ask the manager
status: todo
depends:
  - task-01-a-supervised-daemon-writes-its-record.md
layer: server
refs:
  - "[code://packages/server/src/daemon.ts#L716-L740](../../../../packages/server/src/daemon.ts#L716-L740) - `stop`, a signal to the recorded pid"
  - "[code://packages/server/src/commands/restart.ts#L490-L493](../../../../packages/server/src/commands/restart.ts#L490-L493) - `restartAtTerminal`"
  - "[code://packages/server/src/commands/restart.ts#L1-L11](../../../../packages/server/src/commands/restart.ts#L1-L11) - the served restart, which starts its own successor"
---

## Objective

When the record names a service, `ahpd stop` and `ahpd restart` ask the service manager, and the daemon spawns no successor of its own.

## Files

- `CREATE: packages/server/src/service.ts` - the calls to `systemctl --user` and `launchctl`, behind one interface that a test can replace.
- `UPDATE: packages/server/src/daemon.ts:716-740` - `stop` calls the manager for a record with `service`.
- `UPDATE: packages/server/src/commands/restart.ts:490-493` - a restart at the terminal calls the manager for a record with `service`.
- `UPDATE: packages/server/src/commands/restart.ts` - a served restart of a supervised daemon asks the manager and does not call `start`.
- `UPDATE: packages/server/test/daemon.test.ts` - the stop cases.
- `UPDATE: packages/server/test/server-cli-restart.test.ts` - the restart cases.

## Steps

1. Write the tests first, with a fake manager.
2. Write `service.ts` with `stop(service)` and `restart(service)` for `systemd` and `launchd`.
3. In `stop`, call the manager for a record with `service`, then wait for the pid to go as now.
4. In `restartAtTerminal`, call the manager for a record with `service`, then wait for a new record.
5. Keep the check on a running turn, which refuses a restart without `--force`.
6. In the served restart, call the manager for a supervised daemon instead of `start`.
7. Set this task and the plan row to `implemented`.

## Validation

- A test: `stop` on a supervised record calls the fake manager's `stop`, and sends no signal.
- A test: `restart` on a supervised record calls the fake manager's `restart`, and starts no process.
- A test: `restart` without `--force` still refuses while a turn runs.
- A test: a record without `service` stops and restarts as now.
- `pnpm -s build`, `pnpm -s typecheck` and the server vitest suite pass.

## Resume
