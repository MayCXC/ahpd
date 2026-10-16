---
title: Each backend offers its own approval options, the host remembers no approval, and a host rule can make a tool call always ask
status: accepted
date: 2026-10-16
supersedes: decisions/each-backend-offers-its-own-approval-options.md
refs:
  - "[code://packages/sdk/src/types/session.ts#L529](../../packages/sdk/src/types/session.ts#L529) - `confirm(toolCallId, approved, optionId)`, the answer a backend receives"
  - "[code://packages/agent-claude/src/session/asking.ts#L174-L180](../../packages/agent-claude/src/session/asking.ts#L174-L180) - `settled` and `canUseTool`, whose options carry the SDK's `suggestions`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L285-L340](../../packages/agent-acp/src/session/handlers.ts#L285-L340) - `askPermission` and the ACP agent's own options"
  - "[code://packages/agent-cofold/src/pauses.ts#L139-L180](../../packages/agent-cofold/src/pauses.ts#L139-L180) - `confirm` sends `alwaysApprove` for `allow-session`"
  - git://5e5f35ce034 - the last commit that holds the superseded decision
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `ConfirmationOption` on `chat/toolCallReady`, `selectedOptionId` on `chat/toolCallConfirmed`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts#L881 - `chat.tools.eligibleForAutoApproval`, the setting the rule is named after
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/workbench/contrib/chat/browser/tools/languageModelToolsService.ts#L1399-L1411 - in VS Code, the session's Auto-Approve level still skips the setting
---

## Context

The protocol lets a tool call offer confirmation options and carries the one the person picked back as `selectedOptionId`.
The reference host offers one standard set for every agent and keeps an "Allow in this Session" answer itself, per tool name.
Each ahpd backend already has its own "always": Claude's `suggestions`, an ACP agent's `allow_always` and `reject_always`, and cofold's `alwaysApprove`.
The backend is what asks and what controls a call, and ahpd has no store for approvals per workspace.
Some tools must ask a person on every call, whatever was allowed before.
Examples are a call that writes to a tracker, sends a message or moves money.
An "always" that a backend remembers, or a permission mode that skips questions, would let such a call run without a person.

## Decision

Each backend offers the options its own agent has, and acts on the `selectedOptionId` through its own mechanism.
The host passes the chosen option through and remembers no approval itself.
A backend whose agent has no "always" (pi) offers no options, and the client draws approve and deny.
One exception: a tool that the host root config key `eligibleForAutoApproval` sets to `false` asks on every call, in every backend.
For such a tool, no backend offers an "always" option, and a remembered allow does not apply.
Every permission mode asks, `bypassPermissions` included, and `dontAsk` refuses the call.
The rule is configuration that the operator sets under `config:change`, not a remembered approval, so the host still keeps no approval.

Source: Softov, 2026-09-28, for host/24, answered "each backend... since its the backend normally who ask calls and control right? maybe ahpd hook in the future... but for ahpd to save we will need to make a store for workspaces and others stuff. so each backend is native by default right?".
Source: Softov, 2026-10-16, for host/101, chose "a decision that amends the old one".
In the same answer he chose "the rule wins over every mode" and "a host root config key".

## Consequences

An "always" lands where the agent keeps it: Claude's settings or session rules, cofold's session store, the ACP agent's own.
Options differ from backend to backend, which is closer to each agent than to VS Code's one set.
A host-kept approval, for pi or across backends, waits for a store for workspace state.
Each backend must remove its "always" options for a tool the rule names, and must ask whatever its mode.
An ACP agent decides itself whether to ask, so the host can enforce the rule only on the MCP tools it serves.
This differs from VS Code, where the session's Auto-Approve level still skips `eligibleForAutoApproval`.

## Options

- **VS Code's standard set, kept by the host per tool name.** It gives one set everywhere and parity with the reference. But the host would keep approvals the agent does not know about. It has no store to keep them past a restart.
- **The rule as in VS Code, skipped by the Auto-Approve level.** It gives parity with the reference. But in `bypassPermissions`, a call that moves money would run without a question.
- **A row in host/101 only, with the old decision unchanged.** The old decision says each backend's "always" applies everywhere. A later reader would remove the exception as a bug.
