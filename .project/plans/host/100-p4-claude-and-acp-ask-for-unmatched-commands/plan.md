---
title: Claude and ACP ask only for unmatched commands
domain: host
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/host/100-terminal-commands-approved-by-rule/plan.md
  - plans/host/100-p2-a-session-gets-its-owners-command-check/plan.md
changes: []
creates: []
decisions: []
refs:
  - "[code://packages/agent-claude/src/session/asking.ts#L174-L180](../../../../packages/agent-claude/src/session/asking.ts#L174-L180) - `settled` and `canUseTool`"
  - "[code://packages/agent-claude/src/session/query.ts#L456](../../../../packages/agent-claude/src/session/query.ts#L456) - `canUseTool` is wired here"
  - "[code://packages/agent-claude/src/session/config.ts#L150-L211](../../../../packages/agent-claude/src/session/config.ts#L150-L211) - `sourceFirst`, which may change the `Bash` input first"
  - "[code://packages/agent-acp/src/session/handlers.ts#L285-L340](../../../../packages/agent-acp/src/session/handlers.ts#L285-L340) - `askPermission`"
---

## Goal

Claude and ACP call the session's `getAutoApproval` before they ask about a shell command.
An approved command runs without a question and is said with `confirmed: 'not-needed'`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -n "canUseTool\|askPermission" packages/agent-claude/src packages/agent-acp/src` - one place each where a call asks.

### Runtime path

```
canUseTool(Bash) / askPermission(execute) -> getAutoApproval -> not-needed: run / nothing: ask as now
```

### Gaps

- ACP agents put the command line in different places in a permission request.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Claude and ACP are in scope | Softov, 2026-10-16, chose "All four" for "Which backends are in scope" | 01, 02 |
| `bypassPermissions` and `dontAsk` keep their answers | (defaulted: the rule narrows the questions and adds none) | 01 |
| ACP selects the agent's `allow_once` option for an approved command, and never an "always" option | [code://.project/decisions/each-backend-offers-its-options-unless-a-rule-asks.md](../../../../.project/decisions/each-backend-offers-its-options-unless-a-rule-asks.md) | 02 |

## Proposed architecture

- **Layer responsibilities** - agent-claude calls the check in `canUseTool` for `Bash`. agent-acp calls it in `askPermission` for a call of kind `execute`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Claude asks only for unmatched commands](task-01-claude-asks-only-for-unmatched-commands.md) | todo | - |
| [02 - ACP asks only for unmatched commands](task-02-acp-asks-only-for-unmatched-commands.md) | todo | - |

## Risks and tradeoffs

- An ACP agent decides itself which calls it asks about, so the check runs only on the questions it sends.

## Resume state

- **Done so far:** planned 2026-10-16 from the answers in the parent plan.
- **Next action:** [task-01-claude-asks-only-for-unmatched-commands.md](task-01-claude-asks-only-for-unmatched-commands.md).
- **Open questions:** none.
- **Watch out for:** the check may be async after p3; await it in both backends.

## Final verification checklist

- [ ] Each backend runs an allowed command without a question and asks for another one.
- [ ] `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.
- [ ] `plans/index.md` updated.
