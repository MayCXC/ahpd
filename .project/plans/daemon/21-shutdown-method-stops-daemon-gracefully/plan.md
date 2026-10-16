---
title: The shutdown method stops the daemon gracefully
domain: daemon
status: built
priority: high
created: 2026-10-13
revalidated: 2026-10-13
refs:
  - "[code://packages/server/src/commands/run.ts#L788-L798](../../../../packages/server/src/commands/run.ts#L788-L798) - `diagnostics.shutdown`, which sends `SIGTERM` to the daemon's own process"
  - "[code://packages/server/src/commands/run.ts#L1110-L1149](../../../../packages/server/src/commands/run.ts#L1110-L1149) - `way`, the lifecycle whose `shutdown` runs the way down, and the `SIGINT` and `SIGTERM` handlers that call it"
  - "[code://packages/server/src/commands/run.ts#L1201-L1203](../../../../packages/server/src/commands/run.ts#L1201-L1203) - the control pipe on Windows, which calls `way.shutdown` directly, the pattern to reuse"
  - "[code://packages/sdk/src/host/vscodemethods.ts#L428-L433](../../../../packages/sdk/src/host/vscodemethods.ts#L428-L433) - the `shutdown` method: it answers, then calls `diagnostics.shutdown`"
  - "[code://packages/server/src/commands/restart.ts#L150-L160](../../../../packages/server/src/commands/restart.ts#L150-L160) - `Lifecycle.shutdown`: down once, then exit"
  - "[code://packages/server/src/daemon.ts#L555-L577](../../../../packages/server/src/daemon.ts#L555-L577) - `deliver`, which says why `SIGTERM` on Windows is a hard kill"
---

## Goal

The AHP `shutdown` method stops the daemon through its way down on every platform.
Today it sends `SIGTERM` to the daemon's own process. On Windows, Node makes that a hard kill, so the `stopping` event, the plugin connections, the listeners and `host.close()` never run.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "process.kill\(process.pid" packages/server/src` - only `diagnostics.shutdown` signals the daemon's own process.
- `rg "way.shutdown" packages/server/src` - the `SIGINT` and `SIGTERM` handlers and the control pipe call it.

### Runtime path

```
client shutdown -> vscodemethods.ts shutdown -> logs.close -> diagnostics.shutdown -> process.kill(self, SIGTERM) -> (Linux) way.shutdown | (Windows) hard kill
```

### Gaps

- On Windows, the `shutdown` method ends the daemon with no way down.
- `diagnostics` is built before `way` exists, so a direct call needs a guard for a request that arrives first.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| The `shutdown` method calls the lifecycle's `shutdown` directly, and sends no signal | Softov, 2026-10-13, to "Should I write a small daemon plan for it: call the shutdown handler directly?" - "Write the plan" | 01 |
| A stopping daemon closes each WebSocket with 1001 instead of dropping it | Softov, 2026-10-15, to "On shutdown the daemon drops each WebSocket (code 1006) instead of closing it. What do we do?" - "Pass, fix as a small task" | 02 |

## Proposed architecture

- **Data flow** - `diagnostics.shutdown` calls `way.shutdown()`, as the control pipe does.
- **Event flow** - unchanged: the method answers, the logs close, then the way down runs and the process exits.
- **Layer responsibilities** - server: `run.ts` only. No change to the sdk, the protocol or a client.
- **Source-of-truth files** - [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The shutdown method runs the way down](task-01-the-shutdown-method-runs-the-way-down.md) | done | - |
| [02 - A client hears the daemon go away](task-02-a-client-hears-the-daemon-go-away.md) | done | - |

## Risks and tradeoffs

- A `shutdown` that arrives before `way` exists must not throw inside a timer. The task makes that case wait for `way`, or stop as today.
- A restart that stops a successor it started still sends `SIGTERM` (`run.ts:1138-1141`), which is a hard kill on Windows. That successor serves nothing yet, so it is out of scope here.

## Resume state

- **Done so far:** planned 2026-10-13; task 01 implemented 2026-10-13, not reviewed. `diagnostics.shutdown` now runs the lifecycle's way down, so a `shutdown` request raises `stopping` and closes the listeners on every platform instead of signalling the daemon.
- **Checked by hand:** on Linux, 2026-10-15, at `3cf1dc13`. After `initialize`, a `shutdown` request is answered, and the log shows `stopping` and `stopped` with no signal. With task 02, each client open at `shutdown` gets code 1001 and `the host is stopping`, checked the same day.
- **Checked by hand on Windows:** On Windows 10 Pro 19045 with Node v24.12.0, 2026-10-15, at `ff1288e0`. `shutdown` after `initialize` answers `{}`, the client gets 1001, and the log shows `stopping` and `stopped` within 10 ms.
- **Next action:** none. The plan is built; see [implemented.md](implemented.md).
- **Open questions:** none.
- **Watch out for:** daemon/20 is not in 0.11.0. A Windows user gets both fixes in the next release.

## Final verification checklist

- [x] A `shutdown` request raises `stopping` and closes the listeners before the exit, and sends no signal.
- [x] By hand on Windows: after `shutdown`, the daemon log shows the way down.
- [x] A client open at `shutdown` gets close code 1001.
- [x] `plans/index.md` updated.
