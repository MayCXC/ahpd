---
title: A run is stopped, and runs are capped
domain: host
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/83-the-host-matches-vscodes-host/plan.md
  - plans/host/80-an-automation-is-a-markdown-file/plan.md
refs:
  - "[code://packages/sdk/src/host/actions.ts#L613-L616](../../../../packages/sdk/src/host/actions.ts#L613-L616) - the host refuses `automationRun/cancelRequested` today"
  - "[code://packages/sdk/src/host/handshake.ts#L225-L249](../../../../packages/sdk/src/host/handshake.ts#L225-L249) - the automation capabilities, and the comment on why `runCancellation` is absent"
  - "[code://packages/sdk/src/host/automations.ts#L195-L240](../../../../packages/sdk/src/host/automations.ts#L195-L240) - `waiting` and `settleRun`"
  - "[code://packages/sdk/src/host/gate.ts#L201](../../../../packages/sdk/src/host/gate.ts#L201) - the action already maps to `automation:cancel`"
  - "[code://packages/sdk/src/automations.ts#L374](../../../../packages/sdk/src/automations.ts#L374) - `memoryAutomations`, which keeps every run"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostAutomationService.ts - `handleCancel`, `_cancelRun` and `RUN_HISTORY_PAGE_SIZE`
---

## Goal

Stop on a running automation in VS Code's window stops it, and each automation keeps its 50 newest runs.

## Reconnaissance

### Searches performed

- `rg -n "cancelRequested|runCancellation|runHistoryLimit" packages/sdk/src` - refused and not advertised.

### Runtime path

```
automationRun/cancelRequested -> gate automation:cancel -> cancel each run session's turn, or drop the waiting run -> settle cancelled -> run channel says cancelled
```

### Gaps

- The action is refused, and a run that waits for a slot cannot be removed.
- Runs grow with no limit.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| A cancelled run cancels each session's turn and keeps the session | Softov, 2026-10-11, to "When VS Code stops a running automation, what happens to its session?" - "Cancel turn, keep session" | 01 |
| The host advertises `runHistoryLimit: 50` and keeps 50 runs for each automation | Softov, 2026-10-11, to "Should ahpd advertise runHistoryLimit and trim old runs?" - "Yes, 50 like VS Code" | 02 |
| Only a run that has ended is trimmed | VS Code's `agentHostAutomationService.ts` | 02 |

## Proposed architecture

- **Event flow** - the action cancels the turn through the path `chat/turnCancelled` takes, and `settleRun` settles the run as `cancelled`.
- **State flow** - the store drops the oldest ended runs past 50 when it adds a run.
- **Layer responsibilities** - `packages/sdk`: the action and the capability · `packages/server`: the store host 80 moves there.
- **Source-of-truth files** - [`code://packages/sdk/src/host/automations.ts`](../../../../packages/sdk/src/host/automations.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A run is stopped](task-01-a-run-is-stopped.md) | done | - |
| [02 - Each automation keeps its 50 newest runs](task-02-runs-are-capped.md) | done | - |

## Risks and tradeoffs

- A session in a run can wait for a person - the cancel ends that wait too, as a turn cancel does.

## Resume state

- **Done so far:** every task is done, and the plan is built. See [implemented.md](implemented.md).
- **Next action:** Softov's check by hand: stop in VS Code's window ends a running automation as cancelled.
- **Open questions:** none.
- **Watch out for:** the store is still `packages/sdk/src/automations.ts`; host 80 has not moved it. Three capability cases in the tests now carry `runHistoryLimit` beside `runCancellation`, and a later task that adds a capability moves them again.

## Final verification checklist

- [x] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server` pass.
- [ ] Stop in VS Code's window ends a running automation as cancelled.
- [x] `plans/index.md` updated.
