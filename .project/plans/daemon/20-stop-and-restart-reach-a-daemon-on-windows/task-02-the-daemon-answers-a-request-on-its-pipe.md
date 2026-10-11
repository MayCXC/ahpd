---
title: The daemon answers a request on its pipe
status: todo
depends: [task-01-the-record-names-a-control-pipe-and-key.md]
layer: "packages/server"
refs:
  - "[code://packages/server/src/commands/run.ts#L183-L184](../../../../packages/server/src/commands/run.ts#L183-L184) - `AHPD_DETACHED`, read and deleted"
  - "[code://packages/server/src/commands/run.ts#L1012-L1064](../../../../packages/server/src/commands/run.ts#L1012-L1064) - the way down and its signals"
  - "[code://packages/server/src/commands/run.ts#L1097-L1105](../../../../packages/server/src/commands/run.ts#L1097-L1105) - the restart signals"
---

## Objective

A detached daemon with `AHPD_CONTROL` listens on its pipe, and runs the handler of the signal a request names when the key matches.

## Files

- `CREATE: packages/server/src/control.ts` - `controlServer(control, handlers, log)`, the listener and the request check.
- `UPDATE: packages/server/src/commands/run.ts:183-184` - read and delete `AHPD_CONTROL` with `AHPD_DETACHED`.
- `UPDATE: packages/server/src/commands/run.ts:1063-1105` - start the control server with the shutdown and restart handlers, and close it on the way down.
- `CREATE: packages/server/test/control.test.ts` - cases for the request path over a unix socket path.

## Steps

1. Read `AHPD_CONTROL` in `run.ts` and delete it from `process.env` at once.
2. Write `controlServer` over `net.createServer`, listening on `control.pipe`.
3. Read one line of JSON from each connection, then close the connection.
4. Compare the key with `timingSafeEqual`, and refuse a key of another length without a compare.
5. Log a refused request as `control: refused a request with a wrong key`, without the key.
6. Map `SIGTERM` to `way.shutdown`, `SIGHUP` to `answer(false)` and `SIGUSR2` to `answer(true)`.
7. Refuse a signal name not in that map, and log it.
8. Start the server only in a detached daemon that has a control.
9. Close the server in the way down, before the listeners close.
10. Keep `process.on` for every signal, so Unix behaviour does not change.

## Validation

- `control.test.ts` sends `SIGTERM` with the right key, and the shutdown handler runs once.
- A request with a wrong key runs nothing, and the log line holds no key.
- A request with an unknown signal runs nothing.
- `SIGHUP` with a turn running logs the refusal that `answerRestartSignal` writes, and `SIGUSR2` restarts.
- `server-restart.test.ts` and `server-cli-restart.test.ts` pass unchanged.
- `pnpm -s typecheck` and `pnpm exec vitest run packages/server` pass.

## Resume
