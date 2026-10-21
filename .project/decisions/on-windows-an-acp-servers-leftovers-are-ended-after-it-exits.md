---
title: On Windows an ACP server is asked to stop by its stdin, and what it leaves running is ended after it exits
status: accepted
date: 2026-10-19
refs:
  - "[code://packages/agent-acp/src/connection.ts](../../packages/agent-acp/src/connection.ts) - `connectAcp`, `signal`, `close` and `endLeftovers`"
  - "[code://packages/sdk/src/machines/terminals.ts#L405-L443](../../packages/sdk/src/machines/terminals.ts#L405-L443) - the terminal's own Windows answer: no `detached`, and `taskkill /T /F` for its tree"
---

## Context

`connectAcp` stopped a server with `process.kill(-pid, ...)`, a signal to the group the server leads.
Windows has no process group: the call throws there, the catch took it for a group already gone, and neither the SIGTERM nor the SIGKILL after it ever reached the server.
On Windows an ACP server, and everything it started, outlived its session; in the tests, each held the folder it ran in, and the folder could not be removed.
`detached` was set there too, where it means a console of its own rather than a group.

## Decision

On Windows the server is spawned without `detached`, as a terminal is.
The close asks it to stop the only way there is, by closing its stdin; a server still there after the five-second grace has its tree ended with `taskkill /T /F`.
Once the server has exited, what it left running is found by the parent id Windows keeps after a parent is gone, kept to the processes started since the server was, and ended with `taskkill /F`, in the background, so a close does not wait on reading the process list.
Source: Softov, 2026-10-19, asked "On Windows, how should ahpd stop an ACP server and the processes it started, when a session closes?": "Note the tree, end leftovers (Recommended)".
The tree is noted after the exit rather than before the close: Windows keeps the parent id, so the read is one per close and off the close's own path.

## Consequences

A Windows close of a server that exits on its stdin is as quick as on Linux; one that keeps running is ended after the grace, as a POSIX one that ignores the SIGTERM is.
What a server started is ended a moment after the close returns, not before it.
A server gets no SIGTERM on Windows, so it has its stdin's end, and nothing else, to unwind on.

## Options

- **End the tree at once.** Lost: a server on Windows never gets to flush or save before it goes.
- **Leave it, and fix only the tests.** Lost: every Windows session leaves its agent's processes running.
