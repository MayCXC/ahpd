---
title: A live change of the session tools removes the `ahp` server from a claude session, then adds it again
status: accepted
date: 2026-10-13
refs:
  - "[code://packages/agent-claude/src/session/clienttools.ts#L482-L494](../../packages/agent-claude/src/session/clienttools.ts#L482-L494) - `setTools`, which declares `ahp` again with the new tools"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.278 - `Query.setMcpServers` connects only a name that is not registered yet
---

## Context

`setTools` gives a running claude session a new tool list through `setMcpServers`, with the `ahp` server declared again.
The Claude SDK connects only a server name that is not registered yet.
`ahp` is registered when the session starts, so the SDK keeps the old server and the CLI keeps the old tools.

## Decision

When the tool list changes, `setTools` calls `setMcpServers` twice.
The first call declares the servers without `ahp`, so the SDK disconnects it.
The second call declares the new `ahp`, so the SDK connects it with the new tools.
An empty tool list makes only the first call.

Source: Softov, 2026-10-13, asked "How should host/33 make a live change reach a running session?": "Remove, then add again (Recommended)".

## Consequences

Between the two calls, the CLI has no `ahp` server, so a call of a session tool in that moment fails.
The SDK's own warning names this way: "until the server is removed and re-added".

## Options

- **Change the tools in place and send `tools/list_changed`**: no gap, but no test shows that the CLI reloads the list on that notice.
- **New sessions only**: a running session keeps the old tools, which is what failed live.
- **Start the chat again**: each change costs the CLI process.
