---
title: The host's servers are declared
status: done
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/claude.ts#L662](../../../../packages/agent-claude/src/claude.ts#L662) - the declared servers"
  - "[code://packages/agent-claude/src/mcp.ts#L29](../../../../packages/agent-claude/src/mcp.ts#L29) - `serversFor`"
  - "[code://packages/agent-claude/test/agent-claude-host-servers.test.ts](../../../../packages/agent-claude/test/agent-claude-host-servers.test.ts) - the cases"
---

## Objective

`create` declares the host's servers, in the SDK's shape, with the servers of the CLI's files over them.

## Files

- `UPDATE: packages/agent-claude/src/mcp.ts` - `offeredServers`.
- `UPDATE: packages/agent-claude/src/claude.ts:662` - the declared servers.
- `UPDATE: docs/sdk/TOOLS.md:80`, `packages/sdk/src/types/agent.ts` - what the Claude backend does with the map.
- `CREATE: packages/agent-claude/test/agent-claude-host-servers.test.ts` - the cases.

## Steps

1. Add a case that declares an HTTP and a stdio server of the host beside a project's server.
2. Add a case where the host's map and the project's file use one name.
3. Add a case with a stdio server in another folder, in a folder nobody vouched for.
4. Run the cases, and see the first and the third fail.
5. Add `offeredServers`, and declare its servers under the CLI's files.
6. Run the cases again, and see them pass.

## Validation

- Run `agent-claude-host-servers.test.ts` before step 5, and see the first and the third case fail.
- Run it after step 5, and see every case pass.
- The type check passes.

## Resume

Done 2026-10-29.
Every step is built, and every check the Validation names was run.
