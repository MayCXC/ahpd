---
title: A targeted token reaches only its server
domain: host
status: active
priority: high
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L546-L707](../../../../packages/sdk/src/host/handshake.ts#L546-L707) - `authenticate`, which gives an MCP token to every chat that waits for its resource and keeps it under that resource"
  - "[code://packages/sdk/src/host/handshake.ts#L73-L87](../../../../packages/sdk/src/host/handshake.ts#L73-L87) - `tokensFor`, which starts a session on the tokens kept under its backend's resources"
  - "[code://packages/sdk/src/host/handshake.ts#L102-L156](../../../../packages/sdk/src/host/handshake.ts#L102-L156) - `expire` and `forgetExpiry`, keyed by resource"
  - "[code://packages/sdk/src/host/auth.ts#L127-L137](../../../../packages/sdk/src/host/auth.ts#L127-L137) - `lent`, which spends a token kept under a resource on the host's own lookups"
  - "[code://packages/sdk/src/host/auth.ts#L165-L178](../../../../packages/sdk/src/host/auth.ts#L165-L178) - `channelAwaiting`, which draws an MCP server's requirement on its session"
  - "[code://packages/sdk/src/host/tooling.ts#L897](../../../../packages/sdk/src/host/tooling.ts#L897) - `clientPluginsOf`, the half of a session's customizations its clients handed it"
  - "[code://packages/sdk/src/types/session.ts#L786-L805](../../../../packages/sdk/src/types/session.ts#L786-L805) - `authenticated` and `awaiting`, the backend's side of a sign-in"
  - "[code://packages/sdk/src/types/host.ts#L1170-L1173](../../../../packages/sdk/src/types/host.ts#L1170-L1173) - `Credential`, a token and when it runs out"
  - "[code://packages/sdk/src/types/host.ts#L1260-L1272](../../../../packages/sdk/src/types/host.ts#L1260-L1272) - `Connection.tokens`, kept by resource"
  - "[code://packages/agent-claude/src/session/servers.ts#L402-L431](../../../../packages/agent-claude/src/session/servers.ts#L402-L431) - Claude's `authenticated`, which gives the token to the first server that waits for the resource"
  - "[code://packages/agent-claude/src/session/servers.ts#L219-L229](../../../../packages/agent-claude/src/session/servers.ts#L219-L229) - `serverNamed`, from a customization id to the CLI's name for the server"
  - "[code://packages/sdk/src/sessions/nested.ts#L1311-L1323](../../../../packages/sdk/src/sessions/nested.ts#L1311-L1323) - a nested session hands the token to the host inside, with no target"
  - "[code://packages/sdk/test/toolauth.test.ts](../../../../packages/sdk/test/toolauth.test.ts) - a Claude session whose server needs a sign-in, with the network and the SDK mocked"
  - "[code://packages/sdk/test/nested-proxy.test.ts#L455-L467](../../../../packages/sdk/test/nested-proxy.test.ts#L455-L467) - a sign-in that the inner session asks for reaches the inner host"
  - "[code://docs/sdk/AHP.md#L96](../../../../docs/sdk/AHP.md#L96) - the `authenticate` row"
  - "[code://docs/sdk/AUTHENTICATION.md#L72-L78](../../../../docs/sdk/AUTHENTICATION.md#L72-L78) - what `authenticate` does with a token"
  - "https://github.com/microsoft/agent-host-protocol/blob/0b7b7f9f4ceb2fbd8846557416f765ac73da647d/docs/specification/authentication.md#L117-L155 - `target`: the token is that server's alone, an unknown target is `-32602`, and tokens are keyed by resource and target"
  - "https://github.com/microsoft/agent-host-protocol/blob/0b7b7f9f4ceb2fbd8846557416f765ac73da647d/types/common/commands.ts#L1283-L1317 - `McpServerAuthenticateTarget`, a session URI and a customization id"
  - "https://github.com/microsoft/agent-host-protocol/commit/fe98503d5e0a9f3277109c382f1972d63be53987 - the commit that added `target`"
  - "https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentService.ts#L2033-L2048 - VS Code refuses an unknown target kind, session or server with `InvalidParams`"
  - "https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostAuthenticationService.ts#L151-L223 - VS Code gives a targeted token to no provider's own resource, and keeps it under its target"
  - "https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostAuthenticationService.ts#L498-L502 - `_key`, a token's key with its target"
  - "https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L5186-L5226 - `resolveMcpAuthentication`, the targeted server's pending request alone, when its resource matches"
  - "https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/shared/mcpCustomizationController.ts#L606-L620 - `getMcpServerCustomizations`, the MCP servers of a session at the top level and as children"
---

## Goal

A client that answers one MCP server's sign-in names that server in `authenticate`'s `target`, and the token goes to that server in that session alone.
No other server, no other session and no backend's own resource gets it, even when they share the resource.
A target that names nothing this host publishes is refused with `-32602`, as the protocol requires.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "target" packages/sdk/src/host/handshake.ts` - nothing reads `params.target`.
- `rg "authenticated\(|awaiting\(" packages/*/src` - the host calls `authenticated` in `handshake.ts`, and Claude and the nested session implement it.

### Runtime path

```
authenticate { resource, token, target } -> every chat of every session whose awaiting() holds the resource
  -> chat.authenticated(resource, token) -> Claude: the first server waiting for the resource gets the header
  -> connection.tokens.set(resource) -> tokensFor and lent spend it as the resource's own token
```

### Gaps

- `authenticate` ignores `target`, so a token for one server reaches every session's chats that wait for the same resource.
- Claude gives the token to the first server that waits for the resource, which may not be the one the client signed in for.
- The token is kept under the resource, so `tokensFor` starts the client's next session on it when a backend advertises the same resource.
- `lent` spends it on the host's own GitHub lookups in the same case.
- A target that names an unknown session or customization is answered `{}`.
- An empty token with a target withdraws the token kept under the resource, for every consumer.
- A nested session hands the token to the host inside with no target.
  That host then gives it to every server inside that waits for the resource.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A target whose `kind` is not `mcpServer` is refused with `-32602` | VS Code's `authenticate`; the kind is extensible and this host knows one | 01 |
| An unknown session, a customization the session does not publish, or one that is not an MCP server, is refused with `-32602` | the protocol's `target` rule | 01 |
| The session is found under any spelling a client uses for it | [code://packages/sdk/src/host/routing.ts#L48-L57](../../../../packages/sdk/src/host/routing.ts#L48-L57) | 01 |
| The server is looked for at the top level and among each customization's children, in what the session publishes | the protocol's `target` rule; VS Code's `getMcpServerCustomizations` | 01 |
| A resource that is not the one the targeted server waits for is refused with `-32602` | the protocol's `target` rule; [code://packages/sdk/src/host/handshake.ts#L557-L562](../../../../packages/sdk/src/host/handshake.ts#L557-L562), this host's answer for a resource it did not advertise | 01 |
| An empty token with a target is held to the same checks, and withdraws only the token kept for that target | the protocol's revocation rule, "limited to `target` when supplied" | 01 |
| A targeted token goes to the chats of that session that wait for the resource, and each is told which server it is for | the protocol's `target` rule | 01 |
| A targeted token is kept under its resource and its target, so the lookups by resource never find it | the protocol's "Why keyed by `resource` and optional `target`?"; VS Code's `_key` | 01 |
| A targeted token that runs out is said on its session, as `auth/required` with `reason: 'expired'` | [code://packages/sdk/src/host/auth.ts#L165-L178](../../../../packages/sdk/src/host/auth.ts#L165-L178) | 01 |
| `authenticated` takes the server's customization id, and Claude gives the token to that server alone | the protocol's `target` rule | 01 |
| A nested session hands the target to the host inside, naming the inner session | the protocol's `target` rule; [code://packages/sdk/src/sessions/nested.ts#L405](../../../../packages/sdk/src/sessions/nested.ts#L405) | 01 |
| A token with no target keeps its present path | the protocol: "Without `target`, hosts retain resource/scope matching for backwards compatibility" | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host honours a token's target](task-01-the-host-honours-a-tokens-target.md) | todo | - |

## Risks and tradeoffs

- The protocol package this host builds on is 1.0.0, which has no `target`.
  The protocol says no version bump is needed, so the host reads the field from the request as it arrives.
- A targeted token for a server that already connected is refused, because that server no longer advertises a resource.
  A token with no target is answered the same way today.

## Resume state

- **Done so far:** planned 2026-10-30.
- **Next action:** [task-01-the-host-honours-a-tokens-target.md](task-01-the-host-honours-a-tokens-target.md).
- **Open questions:** none.
- **Watch out for:** a session's servers come from its lead chat and from its clients' plugins, so the lookup reads both halves.
