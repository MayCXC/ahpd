---
title: The host offers what VS Code's own host offers
domain: host
status: active
priority: high
created: 2026-10-11
revalidated: 2026-10-11
decisions:
  - decisions/ahpd-says-it-is-a-native-host.md
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L210-L297](../../../../packages/sdk/src/host/handshake.ts#L210-L297) - the initialize answer: trigger characters, automation capabilities, `_meta`"
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta`"
  - "[code://UPSTREAM.md](../../../../UPSTREAM.md) - Pass 5 lists remote sessions and resources as open"
  - git://32bbe1b8cba - the VS Code commit this plan was read against
  - https://github.com/microsoft/agent-host-protocol - protocol 0.9.0, at cb6ba618
---

## Goal

VS Code's agent window works against ahpd as it works against VS Code's own host.
It can stop a running automation and send a session to ahpd.
It can switch a customization for every session or a folder, and complete `#` in the chat input.

## Reconnaissance

### Searches performed

- `rg -n "remoteSessions|agentHost.resources|hostBuild|ahpSessionUris" packages` - nothing in ahpd.
- `rg -n "runCancellation|cancelRequested" packages/sdk/src` - the host omits the capability and refuses the action.
- `rg -n "completionTriggerCharacters" packages/sdk/src` - the host sends `/` and `@`; VS Code sends `@ # / space`.
- `rg -n "customizationToggled" packages/sdk/src` - the host honours the session scope only.

### Runtime path

```
VS Code window -> initialize and root state _meta -> it offers stop, delegation, scopes and # only where the host said so
```

### Gaps

- Stop on a running automation does nothing.
- The window refuses ahpd as a remote session target.
- A global or folder toggle of a customization lasts one session.
- `#` opens no completion.
- `vscode.agentCustomizationSettings` draws a page only for a `codex` provider, and ahpd has none, so it is not in this plan.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [ahpd says it is a native host, and keeps its session URIs](../../../decisions/ahpd-says-it-is-a-native-host.md) | Softov, 2026-10-11 |

| What | Source | Task |
| --- | --- | --- |
| Write one plan for the parity list, in the suggested order | Softov, 2026-10-11, to "Write a host-domain parity plan for these items now?" - "Yes, full plan" | all |
| A cancelled run cancels each session's turn and keeps the session | Softov, 2026-10-11, to "When VS Code stops a running automation, what happens to its session?" - "Cancel turn, keep session" | p2 |
| The host advertises `runHistoryLimit: 50` and keeps 50 runs for each automation | Softov, 2026-10-11, to "Should ahpd advertise runHistoryLimit and trim old runs?" - "Yes, 50 like VS Code" | p2 |
| `agentCustomizationSettings` waits for a `codex` provider | VS Code registers the page for the Codex harness only | none |

## Proposed architecture

- **Data flow** - each feature is a `_meta` key, a capability, or an action the host serves, with the names VS Code uses.
- **Layer responsibilities** - `packages/sdk`: every key, capability and action · `packages/server`: the stores that keep decisions and runs.
- **Source-of-truth files** - [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts), [`code://packages/sdk/src/host/root.ts`](../../../../packages/sdk/src/host/root.ts)

## Tasks

| Child plan | Status | Depends on |
| --- | --- | --- |
| [p1 - The host describes itself as VS Code's host does](../83-p1-the-host-describes-itself/plan.md) | built | - |
| [p2 - A run is stopped, and runs are capped](../83-p2-a-run-is-stopped-and-runs-are-capped/plan.md) | built | host 80 |
| [p3 - A remote session is taken and keeps its origin](../83-p3-a-remote-session-keeps-its-origin/plan.md) | built | p1 |
| [p4 - A customization is switched for all sessions or a folder](../83-p4-customization-switched-for-all-sessions/plan.md) | built | - |
| [p5 - A chat is attached to a message](../83-p5-a-chat-is-attached-to-a-message/plan.md) | built | p1 |

## Risks and tradeoffs

- FreeBSD has no `platform` value VS Code allows - ahpd leaves `platform` out there, and a request that names a platform skips a FreeBSD host.
- ahpd cannot send a session to another host by itself - the window finds hosts and signs in to them, and hosts do not.

## Resume state

- **Done so far:** p1 to p4 are built on 2026-10-11, and each waits on its check by hand. p5 is built and checked 2026-10-13.
- **Next action:** the checks by hand of p1 to p4.
- **Open questions:** none.
- **Watch out for:** p2 changes the automation store that host 80 moves to `packages/server`; start p2 from main after host 80 merges.

## Final verification checklist

- [ ] Every child plan is built.
- [ ] UPSTREAM.md marks the items as taken.
- [ ] `plans/index.md` updated.
