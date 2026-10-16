---
title: A failed turn moves the counts
status: todo
depends:
  - task-04-a-rows-changes-are-the-sessions-summary.md
layer: sdk
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L999-L1004](../../../../packages/sdk/src/host/spawn.ts#L999-L1004) - the turn end, on complete and cancel only"
  - "[code://packages/sdk/src/host/spawn.ts#L861-L870](../../../../packages/sdk/src/host/spawn.ts#L861-L870) - `chat/error`"
---

## Objective

`chat/error` writes a checkpoint and reads the folder again, as a finished turn does.

## Files

- `UPDATE: packages/sdk/src/host/spawn.ts:999-1004` - add `chat/error` to the turn ends.
- `UPDATE: packages/sdk/test/host-catalogue.test.ts` - the failed turn case.

## Steps

1. Write the test first.
2. Add `chat/error` to the condition at line 999.
3. Set this task and the plan row to `implemented`.

## Validation

- A test: a turn that writes a file and then fails moves the row's counts.
- `pnpm -s typecheck` and the sdk vitest suite pass.

## Resume
