---
title: A Claude session is offered the host's MCP servers - implemented
date: 2026-10-29
refs:
  - git://f7677dcf - the change
  - "[code://packages/agent-claude/src/mcp.ts#L21](../../../../packages/agent-claude/src/mcp.ts#L21) - `offeredServers`, the host's servers in the SDK's shape"
  - "[code://packages/agent-claude/src/claude.ts#L666](../../../../packages/agent-claude/src/claude.ts#L666) - declared under the servers of the CLI's files"
---

A Claude session is offered the MCP servers the host offers every session.
The servers of the CLI's own files win a name both use.

## What was built

- [`code://packages/agent-claude/src/mcp.ts`](../../../../packages/agent-claude/src/mcp.ts) - `offeredServers`: an HTTP server as it is, and a stdio server without its directory.
  A stdio server whose directory is not the session's folder is left out, and the backend's log says so.
- [`code://packages/agent-claude/src/claude.ts`](../../../../packages/agent-claude/src/claude.ts) - `create` declares the host's servers, with `serversFor`'s servers over them.
- [`code://docs/sdk/TOOLS.md`](../../../../docs/sdk/TOOLS.md) and `Start.mcpServers` - what the Claude backend does with the map.
- [`code://packages/agent-claude/test/agent-claude-host-servers.test.ts`](../../../../packages/agent-claude/test/agent-claude-host-servers.test.ts) - three cases.
- [`code://packages/sdk/test/toolauth.test.ts`](../../../../packages/sdk/test/toolauth.test.ts) - its mock of `mcp.js` answers `offeredServers` too, with no server of the host's.

## Verified

- On the code before the change, the first and the third case fail with the host's servers missing.
  The second case passes, since the project's file won before as well.
- After the change, the three cases pass.
- The sdk suite's `toolauth.test.ts` failed in the full run, 4 cases, on a mock without `offeredServers`.
  It passes with the mock's new member.
- The type check passes.

## Departures from the plan

- none.

## Left for later

- none.
