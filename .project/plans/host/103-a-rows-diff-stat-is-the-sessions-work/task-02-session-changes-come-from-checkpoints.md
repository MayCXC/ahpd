---
title: Session Changes come from the checkpoints
status: implemented
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

- **Done so far:** built 2026-10-16. `changes.ts` reads the session's own two commits (`baselineOf`, `latestOf`), diffs them with `git diff --numstat -z` and reads each side with `git show`, holding the answer per session until the commits move; the numstat parse `look` had is now one helper both use. `Session Changes` is VS Code's label and description, `sessionSummary` is on `ChangesetSource`, and the tracker answers where there is no checkpoint answer. 5 tests in `test/checkpoints.test.ts`. Gates: `build`, `typecheck`, `boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` pass; sdk vitest 150 files, 2989 tests pass.
- **Next action:** [task-03-a-worktree-session-has-branch-changes.md](task-03-a-worktree-session-has-branch-changes.md).
- **Open questions:** none.
- **Watch out for:** a scope where the newest checkpoint is the baseline - a turn that has not ended - falls back to `across`, which is VS Code's "no checkpoint pair" rule; the task did not decide that case. `capturedFor` reads the *held* answer rather than running git, because `operations` is synchronous and asks it on every operation list. `packages/sdk/test/fixtures/wire.jsonl` is dirty from the suite; restore it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
