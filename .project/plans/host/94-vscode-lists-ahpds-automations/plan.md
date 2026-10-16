---
title: VS Code lists ahpd's automations
domain: host
status: built
priority: high
created: 2026-10-15
revalidated: 2026-10-15
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L276-L282](../../../../packages/sdk/src/host/handshake.ts#L276-L282) - the `automations` capability, sent when the host has an automation store"
  - "[code://packages/sdk/src/host/handshake.ts#L303-L323](../../../../packages/sdk/src/host/handshake.ts#L303-L323) - the `vscode.*` flags in the initialize `_meta`"
  - "[code://packages/sdk/test/automations.test.ts#L416](../../../../packages/sdk/test/automations.test.ts#L416) - the case that reads the capability off `initialize`"
  - "file:///github/externals/vscode/src/vs/sessions/contrib/providers/agentHost/browser/reconnectableAgentHostAutomationStore.ts#L70-L98 - a host with `automations` and no `vscode.autonomousAutomations` is `incompatible`, and its store is dropped"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/common/agentHostExtensionProtocol.ts#L82-L99 - VS Code's own host always sends the flag"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/common/meta/vscode/agentHostAutomationsMeta.ts - the key, and what it says: a run needs no client"
  - "[research/vscode-host-wire-diff-2026-10-06.md](../../../research/vscode-host-wire-diff-2026-10-06.md) - found the gap on 2026-10-06, under *Not covered by any plan*"
---

## Goal

VS Code's window lists ahpd's automations, and its form creates one.
Today the window says "The agent host needs to be updated to use automations on ahpd", lists none, and the form refuses the workspace.
Softov found this on 2026-10-15, in VS Code on Windows.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "needs to be updated to use automations" vscode/src` - the `incompatible` reason in `automationCataloguePresentation.ts`.
- `rg -n "autonomousAutomations" .project packages` - the research file only. No plan and no code.

### Runtime path

```
initialize -> _meta has no vscode.autonomousAutomations -> state 'incompatible' -> no automation store -> empty list, and the form finds no host
```

### Gaps

- The initialize `_meta` has no `vscode.autonomousAutomations`.
- The flag says that a run needs no client. ahpd's scheduler fires a run with no client, so the flag is true for ahpd.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| Send `_meta['vscode.autonomousAutomations']: true` when the host has an automation store, the same condition as the `automations` capability | Softov, 2026-10-15, chose "Plan host/94, build now" for "How do I fix the missing vscode.autonomousAutomations flag?"; VS Code's host sends it | 01 |

## Proposed architecture

- **Data flow** - `initialize` adds one key to `_meta` under `options.automations`.
- **Layer responsibilities** - sdk: the flag in `handshake.ts` and a case in `automations.test.ts`.
- **Source-of-truth files** - [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host says its automations run with no client](task-01-automations-run-with-no-client.md) | done | - |

## Risks and tradeoffs

- A host with no automation store must not send the flag, or VS Code calls a host with no automations `unsupported` for another reason.
- `packages/sdk/test/fixtures/wire.jsonl` records `initialize`. A test run may rewrite it, so restore it after the tests.

## Resume state

- **Done so far:** built 2026-10-15. Task 01 is done, and Softov checked it in VS Code. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the flag goes in the `_meta` object, not in the `automations` capability.

## Final verification checklist

- [x] A test: `initialize` on a host with automations answers `_meta['vscode.autonomousAutomations']: true`.
- [x] A test: a host with no automation store does not send the flag.
- [x] The gates pass: build, typecheck, boundary, schema and vitest.
- [x] By hand: VS Code's window lists ahpd's automations, and its form creates one.
- [x] `plans/index.md` updated.
