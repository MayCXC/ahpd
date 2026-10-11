---
title: A customization is switched for all sessions or a folder
domain: host
status: draft
priority: medium
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/83-the-host-matches-vscodes-host/plan.md
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1075-L1123](../../../../packages/sdk/src/host/chatactions.ts#L1075-L1123) - `session/customizationToggled`, which reads the session scope only"
  - "[code://packages/sdk/src/host/tooling.ts#L270-L300](../../../../packages/sdk/src/host/tooling.ts#L270-L300) - client plugins keep every scope inside one session"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostCustomizationEnablementService.ts - how VS Code's host keeps global and folder decisions
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/customizationEnablement.ts - which scope wins
---

## Goal

A customization switched off for every session, or for one folder, stays off in each new session there, as in VS Code's own host.

## Reconnaissance

### Gaps

- The host honours the session scope only, so a global or folder toggle from VS Code lasts one session.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| The scopes and their order are VS Code's: the first entry decides, global then folder then session | `customizationEnablement.ts` | - |

## Tasks

None yet; the plan waits on the open questions.

## Resume state

- **Done so far:** nothing.
- **Next action:** ask Softov the open questions, then write the tasks.
- **Open questions:**
  1. Where are global and folder decisions kept: the daemon config file or a state file of their own? - proposed: a state file, as `automations-state.json` is.
  2. Does a global decision apply to every provider, or to the provider it was made in? - proposed: as VS Code's host does.
- **Watch out for:** the host reports the whole enablement array on each customization, not only the scope that changed.
