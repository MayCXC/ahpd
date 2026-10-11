---
title: "`ahpd stop` waits for the daemon to exit, then kills it"
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/server/src/daemon.ts#L436-L444](../../packages/server/src/daemon.ts#L436-L444) - `stop`, which forgets the record when it sends the signal"
  - "[code://packages/server/src/commands/stop.ts#L19-L31](../../packages/server/src/commands/stop.ts#L19-L31) - the `Stopped` line"
---

## Context

`ahpd stop` sends the signal, forgets the record and prints `Stopped` at once.
The daemon can still run its `stopping` handlers and close its stores after that line.
A program that runs `ahpd stop` and then `ahpd start` can find the old daemon still on its port.

## Decision

On every platform, `ahpd stop` waits until the process exits, for at most `STOP_WAIT_MS`.
When the time ends, it kills the process and prints one line that says so.
It prints `Stopped` only for a process that is gone.

Source: Softov, 2026-10-11, asked "On Linux and macOS, `ahpd stop` prints \"Stopped\" before the daemon has exited. Should it also wait, like the Windows path?": "Wait everywhere".

## Consequences

`ahpd stop` takes as long as the daemon's shutdown, up to the limit.
A `stopping` handler that runs longer than the limit is cut off.

## Options

- **Wait on Windows only**: Unix keeps a `Stopped` line for a daemon that still runs.
