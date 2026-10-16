---
title: A customization is switched for all sessions or a folder
domain: host
status: built
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
| Global and folder decisions are kept in a state file of their own, as `automations-state.json` is | Softov, 2026-10-11, to "Where should the daemon keep the global and folder on/off decisions for customizations?" - "Own state file" | - |
| A global decision applies to every provider, keyed by the plugin or MCP server as VS Code's host keys it | Softov, 2026-10-11, to "When a customization is switched off for all sessions, which providers does that cover?" - "Every provider" | - |
| A global or folder decision needs `config:change` on a host with people; without it the toggle switches the sender's session only | (defaulted: review, 2026-10-11; those decisions switch other people's sessions) | 03 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A store keeps the global and folder decisions](task-01-a-store-keeps-the-decisions.md) | done | - |
| [02 - The daemon keeps the decisions in a state file](task-02-the-daemon-keeps-them-in-a-state-file.md) | done | 01 |
| [03 - A toggle records each scope and reaches every session](task-03-a-toggle-reaches-every-session.md) | done | 01 |
| [04 - A new session starts with the global and folder decisions](task-04-a-new-session-starts-with-the-decisions.md) | done | 01, 03 |

## Proposed architecture

- **Data flow** - a toggle writes the store, and each customization a session reports reads its entries from the store.
- **Layer responsibilities** - `packages/sdk`: the key, the store interface, the toggle and the entries · `packages/server`: the state file.
- **Source-of-truth files** - [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts)

## Resume state

- **Done so far:** every task is done, and the plan is built. See [implemented.md](implemented.md).
- **Next action:** Softov's manual VS Code check: a daemon restart with a plugin off for all sessions.
- **Open questions:** none.
- **Uncommitted work outside these tasks:** none.
- **Watch out for:** the host reports the whole enablement array on each customization, not only the scope that changed.
  A backend's own customization is switched by telling it, which happens on the report that says what it has.

## Final verification checklist

- [x] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server` pass.
- [ ] VS Code's window keeps a plugin off for all sessions after a daemon restart.
- [x] `plans/index.md` updated.
