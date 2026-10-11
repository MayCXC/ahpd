---
title: A remote session is taken and keeps its origin
domain: host
status: planned
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/83-the-host-matches-vscodes-host-p1-the-host-describes-itself/plan.md
refs:
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta` that gets `vscode.remoteSessions`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L732](../../../../packages/sdk/src/host/sessionmethods.ts#L732) - `createSession`, which ignores the origin today"
  - "[code://packages/sdk/src/tools/artifacts.ts#L19](../../../../packages/sdk/src/tools/artifacts.ts#L19) - `agentHost/sessionArtifacts`, a summary key the host already keeps"
  - "[code://packages/sdk/src/host/tooling.ts#L1025](../../../../packages/sdk/src/host/tooling.ts#L1025) - `instructions`, where the origin instruction joins"
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/meta/vscode/agentRemoteSessionMeta.ts - `vscode.remoteSessions` and `vscode.remoteSession.origin`
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/chatContributions/remoteSessionOrigin/remoteSessionOriginContribution.ts - the origin instruction and when it is given
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentService.ts - how VS Code's host keeps origin, creator and depth
---

## Goal

VS Code's window can send a session to ahpd.
The session keeps where it came from, so its agent reports back to the chat that sent it.

## Reconnaissance

### Searches performed

- `rg -n "remoteSession|sessionSpawnDepth|createdBySession" packages` - nothing.

### Runtime path

```
window create_remote_session -> picks a host with vscode.remoteSessions and resources -> createSession config._meta['vscode.remoteSession.origin']
  -> host keeps origin, creator and depth on the summary -> each turn gets <remote_session_origin> when a client offers send_remote_message
```

### Gaps

- The window refuses ahpd, and `createSession` drops the origin.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| The keys, the summary fields and the instruction text are VS Code's, word for word | upstream parity | 01, 02 |
| The flag ships with the origin, not before it | (defaulted: a session taken without its origin cannot report back) | 01 |

## Proposed architecture

- **Data flow** - the origin comes in on `createSession`, is kept on the session summary, and survives a restart with the session.
- **Layer responsibilities** - `packages/sdk`: every change.
- **Source-of-truth files** - [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host takes a remote session and keeps its origin](task-01-the-host-takes-a-remote-session.md) | todo | - |
| [02 - The agent is told to report back to the origin](task-02-the-agent-reports-back.md) | todo | 01 |

## Risks and tradeoffs

- ahpd cannot send a session to another host by itself - the window is the hub, and this plan only makes ahpd a target.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-host-takes-a-remote-session.md](task-01-the-host-takes-a-remote-session.md).
- **Open questions:** none.
- **Watch out for:** the window enables the tools only with `chat.remoteSessions.tools.enabled` and `chat.remoteAgentHostsEnabled`; set both for the check by hand.

## Final verification checklist

- [ ] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk` pass.
- [ ] A session sent from VS Code's window opens on ahpd and reports back to the chat that sent it.
- [ ] UPSTREAM.md Pass 5 boxes for remote sessions are checked.
- [ ] `plans/index.md` updated.
