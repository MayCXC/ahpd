---
title: pi and cofold ask only for unmatched commands
domain: host
status: active
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
  - "[code://packages/agent-pi/src/session.ts#L320-L330](../../../../packages/agent-pi/src/session.ts#L320-L330) - `PI_EFFECTS`: bash and powershell are destructive"
  - "[code://packages/agent-pi/src/session.ts#L385-L438](../../../../packages/agent-pi/src/session.ts#L385-L438) - `decide`"
  - "[code://packages/agent-cofold/src/mapping.ts#L511-L580](../../../../packages/agent-cofold/src/mapping.ts#L511-L580) - `approval.requested`"
  - "[code://packages/agent-cofold/src/pauses.ts#L139-L180](../../../../packages/agent-cofold/src/pauses.ts#L139-L180) - `confirm`"
  - "[code://packages/agent-cofold/src/tools.ts#L170-L197](../../../../packages/agent-cofold/src/tools.ts#L170-L197) - `shell_exec`"
---

## Goal

pi and cofold call the session's `getAutoApproval` before they ask about a shell command.
An approved command runs without a question.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -n "decide(\|approval.requested" packages/agent-pi/src packages/agent-cofold/src` - one place each where a call asks.

### Runtime path

```
decide(bash|powershell) / approval.requested(shell_exec) -> getAutoApproval -> not-needed: run / nothing: ask as now
```

### Gaps

- The cofold mapping is pure, so the call to the check may belong in the session.

## Answers

| What | Source | Task |
| --- | --- | --- |
| pi and cofold are in scope | Softov, 2026-10-16, chose "All four" for "Which backends are in scope" | 01, 02 |
| cofold answers an approved command with approve and no `alwaysApprove` | [code://.project/decisions/each-backend-offers-its-options-unless-a-rule-asks.md](../../../../.project/decisions/each-backend-offers-its-options-unless-a-rule-asks.md) | 02 |

## Proposed architecture

- **Layer responsibilities** - agent-pi calls the check in `decide`. agent-cofold calls it before an approval request opens.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - pi asks only for unmatched commands](task-01-pi-asks-only-for-unmatched-commands.md) | implemented | - |
| [02 - cofold asks only for unmatched commands](task-02-cofold-asks-only-for-unmatched-commands.md) | implemented | - |

## Risks and tradeoffs

- pi has no "always" option, so an approved command is the only answer without a person.

## Resume state

- **Done so far:** planned 2026-10-16 from the answers in the parent plan. Task 01 implemented 2026-10-19: `decide` in `packages/agent-pi/src/session.ts` is async and consults `allowedByRule` only after a mode answers `ask`. Task 02 implemented 2026-10-19: `createPauses` offers `autoApprove`, and the live read loop in `runs.ts` answers an approved `shell_exec` before the mapping opens a question. The cofold gate lives in the session, not `mapping.ts`, because the mapping is pure.
- **Next action:** none; both tasks are implemented and the plan is ready to review.
- **Open questions:** none.
- **Watch out for:** the check narrows questions and adds none. A mode that refuses a call still refuses it, and in pi only the `ask` verdict reaches the check. cofold's `shell_exec` input is `{ command }`. The shell is cofold's `DEFAULT_SHELL`: `powershell` on win32, `bash` elsewhere. The resume replay does not call the check, so a replay shows the questions that were asked.

## Final verification checklist

- [x] Each backend runs an allowed command without a question and asks for another one.
- [x] `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.
- [x] `plans/index.md` updated.
