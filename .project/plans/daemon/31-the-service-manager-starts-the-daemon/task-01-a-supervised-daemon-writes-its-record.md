---
title: A supervised daemon writes its record
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/run.ts#L197-L212](../../../../packages/server/src/commands/run.ts#L197-L212) - where `AHPD_DETACHED` is read and removed"
  - "[code://packages/server/src/daemon.ts#L281-L312](../../../../packages/server/src/daemon.ts#L281-L312) - `recordOf`, which builds a record from the announcement"
  - "[code://packages/server/src/daemon.ts#L542-L554](../../../../packages/server/src/daemon.ts#L542-L554) - `claim`, which refuses a second live daemon"
  - "[code://packages/server/src/commands/status.ts#L28-L34](../../../../packages/server/src/commands/status.ts#L28-L34) - `status`, which reads the record"
---

## Objective

A daemon that a service manager starts writes its own `daemon.json`, with a `service` field that names the manager.
`ahpd status` then describes it as it describes a daemon from `ahpd start`.

## Files

- `UPDATE: packages/server/src/daemon.ts:30-82` - `Running` gets `service?: 'systemd' | 'launchd'`.
- `UPDATE: packages/server/src/daemon.ts:281-312` - `recordOf` takes the service name.
- `UPDATE: packages/server/src/commands/run.ts:197-212` - read and remove `AHPD_SERVICE`, and claim the record once the daemon announces itself.
- `UPDATE: packages/server/src/commands/status.ts:35-54` - the plain line and the JSON name the service.
- `UPDATE: packages/server/test/daemon.test.ts` - the cases in Validation.

## Steps

1. Write the tests first.
2. Add `SERVICE_ENV = 'AHPD_SERVICE'` beside `DETACHED_ENV` in `daemon.ts`.
3. Read `AHPD_SERVICE` in `runForeground`, and remove it from `process.env` at once.
4. After the announcement, build the record with `recordOf` and the service name, and write it with `claim`.
5. Stop with a conflict when `claim` answers another live daemon.
6. Remove the record on the way down, as `forget` does for a detached daemon.
7. Add the service to the `status` line and to its JSON.
8. Set this task and the plan row to `implemented`.

## Validation

- A test: a run with `AHPD_SERVICE=systemd` writes a record with `service: 'systemd'` and its own pid.
- A test: a session shell does not inherit `AHPD_SERVICE`.
- A test: a second supervised run with a live record stops with a conflict.
- A test: `status --json` holds the `service` field and no token.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the server vitest suite pass.

## Resume
