---
title: A live tool change does not reach a running claude session
status: open
date: 2026-10-13
severity: major
blocks:
  - plans/host/33-a-session-tool-acts-as-the-person-it-works-for/task-03-the-session-tools-can-be-switched-off.md
refs:
  - "[code://packages/sdk/src/host/tooling.ts#L1085-L1092](../../packages/sdk/src/host/tooling.ts#L1085-L1092) - `retool`, which calls `setTools` and drops a failure or a `false`"
  - "[code://packages/agent-claude/src/session/clienttools.ts#L482-L492](../../packages/agent-claude/src/session/clienttools.ts#L482-L492) - claude's `setTools`, which declares the `ahp` server again with `setMcpServers`"
---

## Symptom

A root `root/configChanged` with `sessionTools` changes each running session's `serverTools` and sends `session/serverToolsChanged`.
The running claude agent does not follow:
- Off at start, then on: the agent's call to `mcp__ahp__list_sessions` answers `No such tool available`.
- On at start, then off: the agent still calls `mcp__ahp__get_current_session`, and it runs.
A new session gets the right tools.

## Cause

Unknown. `retool` ignores what `setTools` answers.
Either the SDK does not replace an MCP server with the same name, or `setMcpServers` fails and nothing logs it.
The tests use a fake handle only. `advancedTools` takes the same path, so it can have the same gap.

## Impact

A switched-off session tool stays callable in a running claude session until the session restarts.
A switched-on one is not seen.

## Workaround

Start a new session, or restart the daemon, after a change.

## Fix

- Log a `false` or a failure from `setTools`, and find what the SDK does with `setMcpServers`.
- If the SDK keeps a server of the same name, declare it under a new name.
- Or refuse the call in the host while the tool is off.
