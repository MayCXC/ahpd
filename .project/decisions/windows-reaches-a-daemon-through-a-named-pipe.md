---
title: On Windows, `ahpd stop` and `ahpd restart` reach a daemon through a named pipe with a key
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/server/src/daemon.ts#L436-L444](../../packages/server/src/daemon.ts#L436-L444) - `stop`, which sends `SIGTERM`"
  - "[code://packages/server/src/commands/run.ts#L1063-L1064](../../packages/server/src/commands/run.ts#L1063-L1064) - the shutdown, on `SIGINT` and `SIGTERM`"
  - "[code://packages/server/src/commands/run.ts#L1097-L1105](../../packages/server/src/commands/run.ts#L1097-L1105) - the restart, on `SIGHUP` and `SIGUSR2`"
  - "[code://packages/server/src/commands/restart.ts#L403-L418](../../packages/server/src/commands/restart.ts#L403-L418) - `realTerminal`, which signals the recorded pid"
  - https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createnamedpipea - the default security descriptor of a named pipe gives read access to Everyone
---

## Context

A detached daemon stops on `SIGTERM` and restarts on `SIGHUP` and `SIGUSR2`.
On Windows, Node sends `SIGTERM` as a hard kill, and `SIGHUP` and `SIGUSR2` cannot be sent to another process.
So on Windows, `ahpd stop` kills the daemon with no `stopping` event and no close, and `ahpd restart` cannot reach it.
The daemon/13 plan chose signals for the terminal and the HTTP API for a remote client, and neither path falls back to the other.

## Decision

On Windows, a detached daemon listens on a named pipe, and `ahpd stop` and `ahpd restart` send their request there.
The pipe name and a key are random for each start, and `daemon.json` records both.
A request carries the key and the name of the signal it stands for, and the daemon runs the handler that signal runs on Unix.
The daemon refuses a request with a wrong key.
On Linux and macOS the terminal still sends signals.

Source: Softov, 2026-10-11, asked "How should `ahpd stop` and `ahpd restart` reach a background daemon on Windows?": "Named pipe + key".

## Consequences

The answer to a restart still comes through `daemon.log`, so the receipt and refusal lines do not change.
The key, not the pipe's access list, keeps out another user, because a named pipe gives read access to Everyone by default.
A random name means another user cannot make the pipe first and receive the key.
The key has the same protection as the token in `connectUrl`, because both are in `daemon.json`.

## Options

- **A request over the daemon's AHP WebSocket, checked against the token**: a daemon with `--without-connection-token` has no token. Also, the request is not an AHP method.
- **The HTTP `stop` and `restart` on the daemon's listener when `http` is off**: this reverses the daemon/13 answer "Local signals, remote API".
