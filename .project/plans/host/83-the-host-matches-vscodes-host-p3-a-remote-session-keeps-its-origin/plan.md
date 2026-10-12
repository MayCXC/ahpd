---
title: A remote session is taken and keeps its origin
domain: host
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/83-the-host-matches-vscodes-host-p1-the-host-describes-itself/plan.md
refs:
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta` that gets `vscode.remoteSessions`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L732](../../../../packages/sdk/src/host/sessionmethods.ts#L732) - `createSession`, which ignores the origin today"
  - "[code://packages/sdk/src/tools/artifacts.ts#L19](../../../../packages/sdk/src/tools/artifacts.ts#L19) - `agentHost/sessionArtifacts`, a summary key the host already keeps"
  - "[code://packages/sdk/src/host/tooling.ts#L1061](../../../../packages/sdk/src/host/tooling.ts#L1061) - `instructions`, where the origin instruction joins"
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
| A malformed origin is dropped and the session is made, as VS Code's host does | Softov, 2026-10-11: "Ignore it, as VS Code" | 01 |
| The instruction names the bare `send_remote_message`, though the model sees a prefixed name | Softov, 2026-10-11: "Keep the text as is"; VS Code's Claude prefixes the name too | 02 |
| The origin instruction is decided on each turn, so a client that joins later gets it | Softov, 2026-10-11: "Fix it in p3 now" | 03 |

## Proposed architecture

- **Data flow** - the origin comes in on `createSession`, is kept on the session summary, and survives a restart with the session.
- **Layer responsibilities** - `packages/sdk`: the origin, the summary and the per-turn instructions. `packages/agent-claude`: the hook that gives them to the model.
- **Source-of-truth files** - [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host takes a remote session and keeps its origin](task-01-the-host-takes-a-remote-session.md) | done | - |
| [02 - The agent is told to report back to the origin](task-02-the-agent-reports-back.md) | done | 01 |
| [03 - The origin instruction is given on each turn](task-03-the-instruction-follows-each-turn.md) | done | 02 |

## Risks and tradeoffs

- ahpd cannot send a session to another host by itself - the window is the hub, and this plan only makes ahpd a target.
- Only the Claude backend takes a per-turn instruction. A session run on ACP, cofold or pi is told nothing, and [deferred.md](deferred.md) names the three.

## Resume state

- **Done so far:** every task is done, and the plan is built. See [implemented.md](implemented.md).
- **Next action:** Softov's check by hand: a session sent from VS Code's window opens on ahpd and reports back to the chat that sent it.
- **Open questions:** none.
- **Watch out for:** the window enables the tools only with `chat.remoteSessions.tools.enabled` and `chat.remoteAgentHostsEnabled`; set both for the check by hand. Only the Claude backend is told per turn; ACP, cofold and pi wait, and [deferred.md](deferred.md) says why.

## Final verification checklist

- [x] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk` pass.
- [ ] A session sent from VS Code's window opens on ahpd and reports back to the chat that sent it.
- [x] UPSTREAM.md Pass 5 boxes for remote sessions are checked.
- [x] `plans/index.md` updated.
