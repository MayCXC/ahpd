---
title: "`ahpd restart` restarts the daemon in place, and refuses while a turn runs - implemented"
date: 2026-10-15
refs:
  - git://b6e61e5d
  - "[code://packages/server/src/commands/restart.ts](../../../../packages/server/src/commands/restart.ts)"
  - "[code://packages/server/src/daemon.ts](../../../../packages/server/src/daemon.ts)"
  - "[code://packages/sdk/src/listen.ts](../../../../packages/sdk/src/listen.ts)"
---

`ahpd restart` at the terminal, and `POST /api/restart` from a client, restart the daemon with the arguments it was started with. A restart refuses while a turn runs and names the sessions, unless it is forced. Sessions resume from the store after it.

## What was built

- [`code://packages/server/src/daemon.ts`](../../../../packages/server/src/daemon.ts) - the record keeps the forwarded argv, and is written through a rename.
- [`code://packages/server/src/commands/restart.ts`](../../../../packages/server/src/commands/restart.ts) - the terminal signals `SIGHUP` or `SIGUSR2`, reads the receipt and the answer from `daemon.log`, and waits for the successor.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - the daemon checks its own turns, quiesces, and starts its successor with the recorded line.
- [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - `Host.close` waits for the agents and terminals it ended, and refuses new work.
- [`code://packages/sdk/src/listen.ts`](../../../../packages/sdk/src/listen.ts) - a listener close lets a response in flight finish for `CLOSE_GRACE_MS`.
- [`code://packages/server/src/commands/plugin.ts`](../../../../packages/server/src/commands/plugin.ts) - `plugin config` names a recorded `--plugin-option` that overrides the key it set.
- [`code://docs/DAEMON.md`](../../../../docs/DAEMON.md) - the restart, its refusal and its wait.

## Verified

- The server suites `server-restart.test.ts` and `server-cli-restart.test.ts` pass on main.
- On Linux, 2026-10-15, at `3cf1dc13`, on a second daemon with its own config folder:
  - After `ahpd restart`, the daemon serves its `--path`, and a session keeps its earlier turns.
  - During a turn, `ahpd restart` exits 1 and names the session. `--force` restarts, and the log names `SIGHUP` and `SIGUSR2`.
  - `POST /api/restart` answers `{"restarting": true}`, and a new pid comes up.
  - `plugin config agent-claude workerStop worker` says that the recorded `--plugin-option` overrides it.

## Departures from the plan

- The final list named the value `turn` and the id `@ahpd/agent-claude`. The values are `worker` and `session`, and since plugin/51 the id is `agent-claude`. The check ran with those.

## Left for later

- The Restart button in ahpapp is not pressed against a daemon. It waits in [a-client-restarts-the-daemon.md](../../../ideas/a-client-restarts-the-daemon.md).
