---
title: A first Windows run starts and stops cleanly
domain: daemon
status: active
priority: high
created: 2026-10-13
revalidated: 2026-10-13
refs:
  - "[code://packages/server/src/commands/configure.ts#L166-L191](../../../../packages/server/src/commands/configure.ts#L166-L191) - the token file, written with no folder made first"
  - "[code://packages/server/src/commands/restart.ts#L177-L197](../../../../packages/server/src/commands/restart.ts#L177-L197) - `lifecycle`, whose `shutdown` runs the way down and exits"
  - "[code://packages/server/src/commands/run.ts#L1122-L1163](../../../../packages/server/src/commands/run.ts#L1122-L1163) - the way down, and the steps given to `lifecycle`"
  - "[code://packages/server/src/daemon.ts#L512-L525](../../../../packages/server/src/daemon.ts#L512-L525) - `forget`, which removes `daemon.json` only when it names the pid given"
  - "[code://packages/server/src/daemon.ts#L65-L70](../../../../packages/server/src/daemon.ts#L65-L70) - `READY_TIMEOUT_MS`, the fixed wait of `ahpd start`"
  - "[code://packages/server/src/daemon.ts#L446-L469](../../../../packages/server/src/daemon.ts#L446-L469) - the wait for the announcement, and the kill when it ends"
  - "[code://packages/server/src/commands/run.ts#L233](../../../../packages/server/src/commands/run.ts#L233) - `stamp`, the one writer of a log line"
---

## Goal

A first run of ahpd on Windows configures, starts and stops with no error, and the log says what happened.
Softov found four problems on 2026-10-13, in the Windows check of daemon/23.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "daemon.json"` and `rg -n "forget\("` in `packages/server/src` - `ahpd start` writes the record, and only `ahpd stop`, `running()` and a restart remove it.
- `rg -n "never said where it was listening"` - the fixed 20 s wait in `daemon.ts`.
- `rg -n "stamp\(" packages/server/src/commands/run.ts` - no line is written on a graceful stop, and none between the start and the announcement.

### Runtime path

```
ahpd configure -> writeFileSync(<configDir>/connection-token) -> ENOENT when <configDir> is not there
shutdown request -> daemonShutdown -> way.shutdown -> down() -> exit(0), and daemon.json stays
ahpd stop -> control pipe -> way.shutdown -> down() -> exit(0), and the CLI removes daemon.json
ahpd start -> spawn -> pty probe, plugins, listen, listening, checks -> announcement, or a kill after 20 s
```

### Gaps

- `configure` does not make the configuration folder before it writes the token file.
- The daemon does not remove its own record on the way down.
- A graceful stop writes nothing to `daemon.log`, so the checklists of daemon/20 and daemon/21 cannot pass.
- A start that is slow on a first run is killed after 20 s, and the log does not say where it was.

## Decisions locked in

| Decision | Source |
| --- | --- |
| None | - |

| What | Source | Task |
| --- | --- | --- |
| Fix the four problems in one plan, one task each | Softov, 2026-10-13: "One plan, three tasks", for problems 1 to 3 | all |
| `configure` makes the folder before it writes the token | Windows check, 2026-10-13: ENOENT on a first run | 01 |
| The daemon removes its own record on the way down | Windows check, 2026-10-13: a shutdown request leaves `daemon.json` | 02 |
| A graceful stop writes `stopping` and `stopped` to the log | Windows check, 2026-10-13; daemon/20 and daemon/21 checklists | 03 |
| Log each start stage, and wait 60 s for the announcement | Softov, 2026-10-13: "Log progress, raise to 60 s" | 04 |

## Proposed architecture

- **Data flow** - `lifecycle.shutdown` logs, runs the way down, forgets the record and exits. `run` stamps each start stage before the announcement.
- **Layer responsibilities** - server only: `configure.ts`, `restart.ts`, `run.ts` and `daemon.ts`.
- **Source-of-truth files** - [`code://packages/server/src/commands/restart.ts`](../../../../packages/server/src/commands/restart.ts), [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - configure makes the folder before the token](task-01-configure-makes-the-folder-before-the-token.md) | implemented | - |
| [02 - the daemon forgets its record on the way down](task-02-the-daemon-forgets-its-record-on-the-way-down.md) | implemented | - |
| [03 - a graceful stop writes to the log](task-03-a-graceful-stop-writes-to-the-log.md) | implemented | 02 |
| [04 - a start logs its stages and waits 60 s](task-04-a-start-logs-its-stages-and-waits-60-s.md) | implemented | - |

## Risks and tradeoffs

- A start that hangs now fails after 60 s, not 20 s.
- `forget` removes the record only when it names this pid, so a restart's successor keeps its record.
- A foreground daemon on Windows still has no graceful stop from outside, because it has no control pipe. This plan does not change that.

## Resume state

- **Done so far:** planned 2026-10-13; all four tasks implemented and reviewed 2026-10-13. Each of the four problems in the Gaps is fixed and has a case.
- **Next action:** the three Windows checks by hand, which are the last four lines of the checklist below.
- **Open questions:** none.
- **Watch out for:** the build runs on Linux, so the Windows checks are by hand. Only task 04's five `start:` lines are read off a real daemon's log, in `server-cli-start.test.ts`. The other checks are verified only by the cases.
- **Touched by all four tasks:** `packages/server/src/commands/restart.ts` (02 and 03), `packages/server/test/server-restart.test.ts` (02 and 03) and `packages/server/src/commands/run.ts` (03 through `log: stamp`, 04 through the stage lines). Task 03 also changed `packages/server/test/shutdown-method.test.ts`, which the plan did not name.

## Final verification checklist

- [ ] On Windows, with no configuration folder, `ahpd configure` runs to the end.
- [ ] On Windows, after a shutdown request, `daemon.json` is gone and the log shows `stopping` and `stopped`.
- [ ] On Windows, after `ahpd stop`, the log shows `stopping` and `stopped`.
- [ ] A start log shows each stage before the announcement.
- [ ] `plans/index.md` updated.
