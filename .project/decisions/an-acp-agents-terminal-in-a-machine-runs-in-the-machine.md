---
title: A terminal an ACP agent in a machine asks for runs in the machine
status: accepted
date: 2026-10-20
refs:
  - "[code://packages/agent-acp/src/session/handlers.ts#L261-L279](../../packages/agent-acp/src/session/handlers.ts#L261-L279) - `openTerminal`, which opens every terminal on the host"
  - "[code://packages/sdk/src/host/terminals.ts#L158-L196](../../packages/sdk/src/host/terminals.ts#L158-L196) - `heldTerminals.open`, the host's shells"
  - "[code://packages/agent-claude/src/claude.ts#L367-L386](../../packages/agent-claude/src/claude.ts#L367-L386) - Claude's CLI entering a machine through `computers.how`"
  - "[code://packages/computer/src/runtime.ts#L3101-L3124](../../packages/computer/src/runtime.ts#L3101-L3124) - `how`, the `docker exec` descriptor for a command in a machine"
---

## Context

An ACP agent placed in a machine runs there, under `docker exec`, and asks its client for a terminal with ACP `terminal/create`.
agent-acp opens every such terminal on the host's shells, whatever the session's placement: nothing routes it into the machine.
On Linux and macOS the machine path is the host's, so the command runs, on the host, outside the sandbox the session asked for, and nothing says so.
On Windows the cwd is a machine path the host has no folder at, and the request fails with "Cannot create process, error code: 267".
Claude, cofold and pi are not affected: their whole process runs in the machine, so do their commands.
Seen on a Windows VM with Docker Desktop 29.9.1, 2026-10-20, in a disposable machine made by hand, tracing the ACP traffic.

## Decision

A terminal an ACP agent asks for in a session placed in a machine runs in that machine: agent-acp asks the computers port how to run the command there (`computers.how`, with the host spelling of the cwd) and opens the host's terminal on what it answers, so the process is in the machine and the terminal is still the host's to list and watch.
Source: Softov, 2026-10-20, asked "An ACP agent placed in a machine sends `terminal/create`, and ahpd runs that command on the HOST (Linux/macOS: silently outside the sandbox; Windows: fails with error 267). What should happen?": "Run it in the machine (Recommended)".

## Consequences

A session that asked for a machine runs its agent's commands in it, on every platform.
A client still sees the terminal, as it does for a session on the host.
`.project/specs/agent-backends.md` says `Start.terminals.open` opens a host terminal, which has to say what it does for a session in a machine.
The fix is its own plan, since it is not a Windows path and touches agent-acp and the computers port.

## Options

- **Do not offer terminals to an ACP agent in a machine.** agent-acp would not advertise the `terminal` capability, and the agent would run commands in its own process, which is in the machine. Lost: a client could not watch those commands.
- **Keep them on the host, and translate the cwd.** Lost: the agent's commands would keep running outside the machine the session asked for.
