---
title: Claude reports tasks through the seam
status: todo
depends: [task-01-a-backend-reports-a-task-the-host-draws.md, task-03-the-host-answers-stop-background-work.md]
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/workers.ts#L451](../../../../packages/agent-claude/src/session/workers.ts#L451) - `reconcileWork`"
  - "[code://packages/agent-claude/src/session/workers.ts#L640-L659](../../../../packages/agent-claude/src/session/workers.ts#L640-L659) - `stopWorker` and `stopTask`"
  - "[code://packages/agent-claude/src/session.ts#L159-L169](../../../../packages/agent-claude/src/session.ts#L159-L169) - `running`"
---

## Objective

`reconcileWork` reports each live task through `Start.backgroundTasks`, and the backend sends no `chat/backgroundWork*` action.
A shell task carries a stop that calls `stopTask`.

## Files

- `UPDATE: packages/agent-claude/src/session/workers.ts` - build records, call the seam, add the shell stop, drop `backgroundWork`.
- `UPDATE: packages/agent-claude/src/session.ts` - drop `running` and its spread.
- `UPDATE: packages/agent-claude/src/session/context.ts` - drop `backgroundWork` from the context.
- `UPDATE: packages/agent-claude/test/agent-claude-background-work.test.ts` - give the fake host the seam, and add the stop cases.

## Steps

1. Change `shellWork` and `subagentWork` to return a `BackgroundTask`.
2. Give a shell task a `stop` that calls `ctx.handle.stopTask(taskId)`.
3. Answer true from the stop when the task is live and `stopTask` resolves, and false otherwise.
4. Call `set` and `remove` in `reconcileWork` in place of `emitOn`.
5. Keep `told` as the ids that each chat holds, so `reconcileWork` knows what to remove.
6. Remove `backgroundWork` from `Workers` and `running` from `session.ts`.
7. Run host/47's nine cases through the fake host's seam.
8. Add a case for each stop answer.
9. Set this task and its plan row to `implemented`.

## Validation

- host/47's nine cases pass.
- A stop on a live shell calls `stopTask` once and answers true.
- A stop on an ended shell answers false.
- `rg "chat/backgroundWork" packages/agent-claude/src` finds nothing.
- `pnpm exec tsc --noEmit`, `pnpm boundary` and `pnpm test` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1, after tasks 01 and 03.
- **Open questions:** none.
- **Watch out for:** the records compare by value in the host, so the stop function must not be rebuilt as a different field each time.
