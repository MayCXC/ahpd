---
title: A Claude shell shows its output
status: todo
depends: [task-02-a-backend-feeds-an-output-terminal.md, task-05-claude-reports-tasks-through-the-seam.md]
layer: agent-claude
refs:
  - "npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `get_task_output` (`sdk.d.ts:4283-4310`); `getTaskOutput` in `sdk.mjs`"
  - "[code://packages/agent-claude/src/session/context.ts#L292](../../../../packages/agent-claude/src/session/context.ts#L292) - `handle`"
---

## Objective

Each Claude shell task has an output terminal, and its row names that terminal.
The backend reads the output with `getTaskOutput` once a second while the task runs, and once after it ends.

## Files

- `CREATE: packages/agent-claude/src/session/taskoutput.ts` - the local type, the poller and the append rule.
- `UPDATE: packages/agent-claude/src/session/workers.ts` - create the terminal at the first listing, and put it on the record.
- `CREATE: packages/agent-claude/test/agent-claude-task-output.test.ts` - the poll cases.
- `CREATE: packages/agent-claude/test/agent-claude-sdk-task-output.test.ts` - fails when the SDK has no `getTaskOutput`.

## Steps

1. Declare a local type for `getTaskOutput(taskId)` and its result: the tail, `total_bytes` and `truncated`.
2. Create an output terminal at a shell task's first listing, titled with the label.
3. Put the terminal URI on the task's record.
4. Read the output once a second while the task is live.
5. Append the new bytes when the growth in `total_bytes` fits in the tail.
6. Replace the content with the tail when the growth is larger than the tail.
7. Read once more after the task ends, then call `finalize()` with no exit code.
8. Stop the poller when the task ends or the session closes.
9. Write the poll cases with a fake `getTaskOutput`.
10. Write the test that the real SDK's query has `getTaskOutput`.
11. Set this task and its plan row to `implemented`.

## Validation

- The poll cases cover a first read, a growth, a gap and the last read.
- The SDK test passes on 0.3.301 and fails without `getTaskOutput`.
- A shell row carries `terminal` on its first set.
- `pnpm exec tsc --noEmit`, `pnpm boundary` and `pnpm test` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1, after tasks 02 and 05.
- **Open questions:** none.
- **Watch out for:** `total_bytes` counts bytes, and a tail cut inside a UTF-8 character must not be appended as broken text.
