---
title: A Claude session is offered the host's MCP servers
domain: claude
status: built
priority: high
created: 2026-10-29
revalidated: 2026-10-29
changes:
  - docs/sdk/TOOLS.md
refs:
  - git://c26f1e96 - the commit of `main` the facts were checked at
  - "[code://docs/sdk/TOOLS.md#L59](../../../../docs/sdk/TOOLS.md#L59) - every session is offered the host's servers, whatever agent it runs"
  - "[code://docs/sdk/TOOLS.md#L80](../../../../docs/sdk/TOOLS.md#L80) - only a backend that cannot take MCP servers ignores them"
  - "[code://packages/sdk/src/host/tooling.ts#L1899](../../../../packages/sdk/src/host/tooling.ts#L1899) - `mcpFor`, the host's servers with the client plugins' over them"
  - "[code://packages/agent-claude/src/claude.ts#L662](../../../../packages/agent-claude/src/claude.ts#L662) - the session declares the servers of the CLI's own files alone"
  - "[code://packages/agent-claude/src/session/query.ts#L360-L374](../../../../packages/agent-claude/src/session/query.ts#L360-L374) - the declared servers go to the SDK, and a plugin's own are skipped there"
  - "[code://packages/agent-claude/src/mcp.ts#L29](../../../../packages/agent-claude/src/mcp.ts#L29) - `serversFor`, the home file and then the project's, nearer winning"
  - "[code://packages/agent-acp/src/session/opening.ts#L158](../../../../packages/agent-acp/src/session/opening.ts#L158) - the ACP backend hands the host's servers on, and says what its shape cannot carry"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeSdkOptions.ts#L235-L266 - the reference hands its servers to the SDK, and leaves out a stdio server whose directory it cannot represent
---

## Goal

A Claude session is offered the MCP servers the host offers every session.
These are the daemon's `mcpServers`, and the servers its client plugins contribute.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "mcpServers" packages/agent-claude/src` - `create` declares the servers of the CLI's own files, and nothing reads `start.mcpServers`.
- `rg -n "skipMcpDiscovery" packages/agent-claude/src` - the CLI is told to skip a plugin's own servers, which are to be declared instead.
- The SDK's stdio server takes a command, its arguments and its environment, and no directory.

### Runtime path

```
daemon config mcpServers + client plugins -> mcpFor -> Start.mcpServers -> create: ignored
CLI: plugin servers skipped, daemon config never read -> the session has neither
```

### Gaps

- The daemon's servers, and a client plugin's, never reach a Claude session.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `create` declares `start.mcpServers` beside the servers of the CLI's files | TOOLS.md, and `skipMcpDiscovery` | 01 |
| The CLI's files win a name the host's map uses too, the project's over the home file | `serversFor`'s own order, nearer winning; the reference leaves a clash to the SDK | 01 |
| An HTTP server goes as it is, and a stdio server without its directory | The SDK's server shapes | 01 |
| A stdio server whose directory is not the session's folder is left out and said | The reference leaves it out; the ACP backend says what it drops | 01 |
| TOOLS.md and `Start.mcpServers` say what the Claude backend does | Both name the in-process backends as ones that ignore the map | 01 |

## Proposed architecture

- **Data flow** - `offeredServers` turns `start.mcpServers` into the SDK's shape, and `serversFor`'s servers go over it.
- **Layer responsibilities** - agent-claude: `mcp.ts`, `claude.ts`; sdk: the doc of `Start.mcpServers`.
- **Source-of-truth files** - [`code://packages/agent-claude/src/mcp.ts`](../../../../packages/agent-claude/src/mcp.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host's servers are declared](task-01-the-hosts-servers-are-declared.md) | done | - |

## Risks and tradeoffs

- A name the host's map and a CLI file both use runs the file's server, which is nearer the work.
  This order is ours: the reference leaves the clash to the SDK.

## Resume state

- **Done so far:** planned and built 2026-10-29. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the home file's servers come from the account the case runs as, so a case names no exact set.

## Final verification checklist

- [x] A session is declared the host's servers beside the ones the CLI's files name.
- [x] The project's file wins a name both use.
- [x] A stdio server that starts in another folder is left out and said.
