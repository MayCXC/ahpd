---
title: Session Changes come from the checkpoints
status: todo
depends:
  - task-01-a-turn-leaves-a-checkpoint.md
layer: sdk
refs:
  - "[code://packages/sdk/src/changes.ts#L485-L503](../../../../packages/sdk/src/changes.ts#L485-L503) - `fold` and `across`, the fallback"
  - "[code://packages/sdk/src/changes.ts#L567-L577](../../../../packages/sdk/src/changes.ts#L567-L577) - `capturedFor`, which serves the `session` scope"
  - "[code://packages/sdk/src/changes.ts#L1076-L1083](../../../../packages/sdk/src/changes.ts#L1076-L1083) - the `session` scope, labelled \"This Session\""
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostChangesetService.ts#L2191-L2232 - `_tryComputeSessionGitDiffs`"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/common/changesetUri.ts#L66-L70 - the label and description of Session Changes"
---

## Objective

The `session` scope is Session Changes: a git diff from `turn/0` to the latest turn checkpoint.
Without a checkpoint, it is the edit tracker of today, as VS Code's `auto` strategy does.

## Files

- `UPDATE: packages/sdk/src/changes.ts:567-577` - `capturedFor` reads the checkpoints for `session`, else `across`.
- `UPDATE: packages/sdk/src/changes.ts:1076-1083` - the label is \"Session Changes\" and the description is \"Show all changes made in this session\".
- `UPDATE: packages/sdk/src/changes.ts` - `sessionSummary(dir, session)`, the counts of Session Changes.
- `UPDATE: packages/sdk/src/types/changes.ts:321-345` - `ChangesetSource` gets `sessionSummary`.
- `UPDATE: packages/sdk/test/checkpoints.test.ts` - the diff cases.

## Steps

1. Write the tests first.
2. Diff `turn/0` to the latest checkpoint with `git diff --numstat -z`, and count new files in full as `look` does.
3. Fall back to `across` when a checkpoint is missing or git fails.
4. Give the scope VS Code's label and description.
5. Write `sessionSummary` from the same diff, and hold it per session.
6. Set this task and the plan row to `implemented`.

## Validation

- A test: two sessions in one folder have their own Session Changes.
- A test: a commit after a turn leaves Session Changes as they were.
- A test: an edit by hand after the last turn is not counted.
- A test: a folder with no git gives the counts of `across`.
- `pnpm -s typecheck` and the sdk vitest suite pass.

## Resume
