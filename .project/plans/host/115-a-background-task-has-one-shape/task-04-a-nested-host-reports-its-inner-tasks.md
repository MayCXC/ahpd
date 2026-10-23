---
title: A nested host reports its inner tasks
status: todo
depends: [task-01-a-backend-reports-a-task-the-host-draws.md, task-03-the-host-answers-stop-background-work.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/sessions/nested.ts#L655-L672](../../../../packages/sdk/src/sessions/nested.ts#L655-L672) - `served`, which passes inner actions out"
  - "[code://packages/sdk/src/sessions/nested.ts#L690-L716](../../../../packages/sdk/src/sessions/nested.ts#L690-L716) - the proxy reduces each inner chat action"
---

## Objective

A nested session shows its inner host's background tasks in the outer chat.

## Files

- `UPDATE: packages/sdk/src/sessions/nested.ts` - turn inner rows into seam calls.
- `CREATE: packages/sdk/test/nested-background-tasks.test.ts` - the cases below.

## Steps

1. Read each inner `chat/backgroundWorkSet` into a `BackgroundTask` on the outer chat.
2. Leave `terminal` off, because the outer client cannot reach the inner terminal.
3. Give the task a `stop` that sends `vscode/stopBackgroundWork` to the inner host, when the inner row carries the flag.
4. Call `remove` for each inner `chat/backgroundWorkRemoved`.
5. Keep the inner actions out of `served`.
6. Write the tests.
7. Set this task and its plan row to `implemented`.

## Validation

- An inner shell row reaches the outer client with no `terminal`.
- An outer stop reaches the inner host and answers its result.
- An inner remove removes the outer row.
- `pnpm exec tsc --noEmit`, `pnpm boundary` and `pnpm test` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** an inner subagent row names an inner chat URI, which the outer client may not know.
