---
title: "`ahpd stop` and `ahpd restart` reach a daemon on Windows"
domain: daemon
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/daemon/13-ahpd-restart/plan.md
decisions:
refs:
  - "[code://packages/server/src/daemon.ts#L9-L37](../../../../packages/server/src/daemon.ts#L9-L37) - `Running`, the record in `daemon.json`"
  - "[code://packages/server/src/daemon.ts#L304-L400](../../../../packages/server/src/daemon.ts#L304-L400) - `start`, which spawns the child with `AHPD_DETACHED=1` and writes the record"
  - "[code://packages/server/src/daemon.ts#L436-L444](../../../../packages/server/src/daemon.ts#L436-L444) - `stop`, which sends `SIGTERM` and forgets the record at once"
  - "[code://packages/server/src/commands/run.ts#L183-L184](../../../../packages/server/src/commands/run.ts#L183-L184) - the child reads and deletes `AHPD_DETACHED`, the pattern for the pipe and key"
  - "[code://packages/server/src/commands/run.ts#L1063-L1064](../../../../packages/server/src/commands/run.ts#L1063-L1064) - the shutdown, on `SIGINT` and `SIGTERM`"
  - "[code://packages/server/src/commands/run.ts#L1097-L1105](../../../../packages/server/src/commands/run.ts#L1097-L1105) - the restart, on `SIGHUP` and `SIGUSR2`, only in a detached daemon"
  - "[code://packages/server/src/commands/restart.ts#L383-L418](../../../../packages/server/src/commands/restart.ts#L383-L418) - `AtTerminal` and `realTerminal`, the seam that sends the signal"
  - "[code://packages/server/src/commands/stop.ts](../../../../packages/server/src/commands/stop.ts) - `ahpd stop` and its `Stopped` line"
  - "[code://docs/DAEMON.md#L225-L245](../../../../docs/DAEMON.md#L225-L245) - how a restart reaches the daemon, in the docs"
---

## Goal

`ahpd stop` and `ahpd restart` stop and restart a detached daemon on Windows as they do on Linux and macOS.
The daemon raises `stopping`, closes plugin connections and listeners, closes the host and forgets its record.
A plain restart is refused while a turn runs, and a forced restart goes.
`ahpd stop` prints `Stopped` only when the process is gone, on every platform.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "SIGTERM|SIGINT|SIGHUP|SIGUSR2|process.kill" packages/server/src` - every signal the daemon sends or takes.
- `rg -n "win32|SIGBREAK" packages/server/src` - nothing.
- `rg -n "Local signals" .project` - the daemon/13 answer on how a restart reaches the daemon.
- `rg -n "SIGHUP|SIGUSR2|ahpd stop" docs packages/server/README.md README.md` - DAEMON.md, the two READMEs.

### Runtime path

```
ahpd stop -> running() reads daemon.json -> deliver(record, 'SIGTERM') -> wait for the pid to exit -> forget -> "Stopped"
ahpd restart -> restartAtTerminal -> AtTerminal.signal -> deliver(record, 'SIGHUP' | 'SIGUSR2') -> daemon.log answer
deliver on win32 -> net.connect(record.control.pipe) -> one line {key, signal} -> the daemon's control server
control server -> key matches -> the handler that signal runs on Unix: way.shutdown, or answerRestartSignal
```

### Gaps

- On Windows, `process.kill(pid, 'SIGTERM')` is a hard kill, and `SIGHUP` and `SIGUSR2` cannot be sent.
- `stop` forgets the record and prints `Stopped` before the process exits.
- `Running` has no place for a pipe name or a key.

## Decisions locked in

| Decision | Source | Task |
| --- | --- | --- |
| [On Windows, `ahpd stop` and `ahpd restart` reach a daemon through a named pipe with a key](../../../../docs/DAEMON.md) | Softov, 2026-10-11 | 01, 02, 03 |

| What | Source | Task |
| --- | --- | --- |
| The pipe is `\\.\pipe\ahpd-<32 hex>`, and the key is 32 random bytes as hex | (defaulted: random from `crypto.randomBytes`, new for each start and each successor) | 01 |
| `start` makes the pipe name and key, gives them to the child in `AHPD_CONTROL`, and the child reads and deletes it at once | (defaulted: the pattern of `AHPD_DETACHED`; the parent writes the record) | 01, 02 |
| The record field is `control: { pipe, key }`, absent on Linux and macOS and from an older record | (defaulted: Unix keeps signals) | 01 |
| A request is one line of JSON, `{"key": "...", "signal": "SIGTERM" \| "SIGHUP" \| "SIGUSR2"}`, and the daemon closes the connection after it | (defaulted: the smallest message that names the handler) | 02 |
| The daemon compares the key with `timingSafeEqual`, logs a refused request without the key, and runs nothing for it | (defaulted: no key in a log line, as no token is) | 02 |
| The control server listens only in a detached daemon, and closes when the way down closes the listeners | (defaulted: the restart signals are only for a detached daemon) | 02 |
| A record with `control` on a platform other than win32 is still sent signals | (defaulted: the decision keeps signals on Unix) | 03 |
| A pipe that does not answer reads as the `ESRCH` case: the daemon is gone | (defaulted: the meaning `unsignalled` gives today) | 03 |
| `STOP_WAIT_MS` is 30 seconds; after it, `stop` sends `SIGKILL` and prints `Killed <url> (pid <n>): it did not stop within 30 seconds.` | (defaulted: a shutdown awaits plugin `stopping` handlers, which can take seconds) | 04 |
| `ahpd stop` forgets the record only after the process is gone | (defaulted: the record is how a second `stop` finds it) | 04 |
| `ahpd stop` waits for the daemon to exit, then kills it, so the line it prints is true only once the process is gone | docs/DAEMON.md already says stop waits; the fix makes the printed line match | 04 |

## Proposed architecture

- **Data flow** - on win32, `start` makes `{pipe, key}`, gives them to the child, and records them. The child listens on the pipe. `stop` and `restart` send `{key, signal}` to it.
- **Event flow** - the control server dispatches `SIGTERM` to `way.shutdown`, `SIGHUP` to `answer(false)`, and `SIGUSR2` to `answer(true)`, the same functions `process.on` binds.
- **State flow** - `daemon.json` holds `control`; the successor of a restart gets a new pipe and key through the same `start`.
- **Layer responsibilities** - `daemon.ts`: the record, the spawn, `deliver` and the wait in `stop`. `commands/run.ts`: the control server. `commands/restart.ts`: `realTerminal.signal` calls `deliver`. `commands/stop.ts`: the lines.
- **Source-of-truth files** - [`code://packages/server/src/daemon.ts`](../../../../packages/server/src/daemon.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The record names a control pipe and key](task-01-the-record-names-a-control-pipe-and-key.md) | done | - |
| [02 - The daemon answers a request on its pipe](task-02-the-daemon-answers-a-request-on-its-pipe.md) | done | 01 |
| [03 - Stop and restart send through the pipe on Windows](task-03-stop-and-restart-send-through-the-pipe.md) | done | 02 |
| [04 - Stop waits for the daemon to exit](task-04-stop-waits-for-the-daemon-to-exit.md) | done | 03 |
| [05 - The docs describe stop and restart on Windows](task-05-docs.md) | done | 04 |

## Risks and tradeoffs

- No Windows machine runs these tests here - the control path uses only `node:net`, so Linux tests drive it over a unix socket path. The Windows checks in the final list run on Softov's Windows machine.
- A `stopping` handler longer than 30 seconds is killed - the line says so, and the limit is one constant.
- The restart still waits on `daemon.log` - this is the daemon/13 handshake, and the pipe only replaces the signal.

## Resume state

- **Done so far:** task 01: `Running` carries `control?: { pipe, key }`, `controlFor(platform, pipe?)` makes it on win32, and `start` hands it to the child in `AHPD_CONTROL` and records it.
  Task 02: `controlServer(control, handlers, log)` in `packages/server/src/control.ts` answers one JSON line per connection, and `runForeground` starts it from `AHPD_CONTROL` and closes it in the way down.
  Task 03: `deliver(record, signal, platform)` sends the request on win32 and the signal elsewhere, `stop` awaits it, and `realTerminal.signal` calls it.
  Task 04: `stop(steps)` waits for the pid to go, kills it after `STOP_WAIT_MS`, forgets the record only then, and answers `{ record, killed }`.
  Task 05: `docs/DAEMON.md` has the paragraph on the pipe and the wait, and the two command lists say `ahpd stop` waits.
- **Next action:** the two Windows checks in the final list, by hand. The plan is built and reviewed; see [implemented.md](implemented.md).
- **Open questions:** none.
- **Watch out for:** never write the key or `connectUrl` to a log line or to stdout; `ahpd status --json` must not print `control`.

## Final verification checklist

- [x] On Linux, `server-restart.test.ts`, `server-cli-restart.test.ts` and `daemon.test.ts` pass, and the signal messages are unchanged.
- [ ] On Windows: `ahpd start --connection-token-file <f>`, open a session, start a turn, `ahpd stop`; the log shows `stopping`, `daemon.json` is gone, and `ahpd status --json` prints `{"running":false}`.
- [ ] On Windows: `ahpd restart` refuses while a turn runs, `ahpd restart --force` restarts, and the successor comes up from the recorded line.
- [x] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/server` pass.
- [x] `plans/index.md` updated.
