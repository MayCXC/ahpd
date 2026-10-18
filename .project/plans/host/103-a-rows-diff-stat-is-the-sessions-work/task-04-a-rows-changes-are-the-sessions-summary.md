---
title: A row's changes are the session's summary
status: implemented
depends:
  - task-02-session-changes-come-from-checkpoints.md
  - task-03-a-worktree-session-has-branch-changes.md
layer: sdk
refs:
  - "[code://packages/sdk/src/host/catalogue.ts#L415-L422](../../../../packages/sdk/src/host/catalogue.ts#L415-L422) - `changesOf`"
  - "[code://packages/sdk/src/host/catalogue.ts#L519-L530](../../../../packages/sdk/src/host/catalogue.ts#L519-L530) - `summaryMoved`"
  - "[code://packages/sdk/src/types/sessions.ts#L167](../../../../packages/sdk/src/types/sessions.ts#L167) - `SessionStore`"
  - "[code://packages/sdk/src/sessions.ts#L505](../../../../packages/sdk/src/sessions.ts#L505) - `fileSessions`, the store on disk"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostChangesetSummary.ts#L11-L15 - `getSummaryChangesetKind`"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostChangesetService.ts#L362-L408 - `computeListEntryChanges`, the persisted summary of a row"
---

## Objective

`changesOf` gives a row Branch Changes for a worktree session and Session Changes otherwise.
The session store keeps the summary, so a restart keeps a row's counts.

## Files

- `UPDATE: packages/sdk/src/host/catalogue.ts:415-422` - `changesOf` picks the kind by `isolation`, as `getSummaryChangesetKind` does.
- `UPDATE: packages/sdk/src/host/catalogue.ts:519-530` - `summaryMoved` sends the session's counts.
- `UPDATE: packages/sdk/src/types/sessions.ts:167` - `SessionStore` gets `changes(id)` and `setChanges(id, summary)`.
- `UPDATE: packages/sdk/src/sessions.ts` - `memorySessions` and `fileSessions` keep the summary.
- `UPDATE: packages/sdk/test/host-catalogue.test.ts` - the cases in Validation.

## Steps

1. Write the tests first.
2. Write `summaryKindOf(uri)`: `branch` for `isolation: worktree`, else `session`.
3. Read the summary of that kind in `changesOf`, and keep a summary with no files out of the row.
4. Keep the summary in the store each time it moves.
5. Read the kept summary for a row of a session that is not loaded.
6. Set this task and the plan row to `implemented`.

## Validation

- A test: two sessions in one folder have different `changes` in their rows.
- A test: a worktree session's row has its Branch Changes.
- A test: a row read from a new store after a restart has the counts it had.
- A test: `session/summaryChanged` carries the session's counts after a turn.
- `pnpm -s typecheck` and the sdk vitest suite pass.

## Resume

- **Done so far:** built 2026-10-16. `host/catalogue.ts` has `summaryKindOf` - `branch` where the session has a worktree record, `session` otherwise - `changesOf`, which reads the summary the host kept for that session and falls back to the directory's only for a session nothing has been read for, and `summaryKept(uri)`, which reads the summary of that kind, keeps it in the store and moves the row. The store carries it: `changes(id)` and `setChanges(id, value)` on `SessionStore`, held on the in-memory row and written to and read back from the file store, with a validator because a file can be edited by hand. `spawn.ts` calls `summaryKept` where the tree is checkpointed - after the baseline, and at the end of every turn before the directory's facts are re-read. 4 tests in `test/host-catalogue.test.ts`. Gates: `build`, `typecheck`, `boundary`, `node tools/schema.mjs` (508 definitions) and `git diff --quiet tools/` pass; sdk vitest 151 files, 2998 tests pass.
- **Next action:** [task-05-a-failed-turn-moves-the-counts.md](task-05-a-failed-turn-moves-the-counts.md).
- **Open questions:** none of the task's own; four choices it does not decide, noted under *Watch out for*.
- **Watch out for:** four places the task was silent and a choice was made. (1) The turn-end wiring in `spawn.ts` is named by no File in this task, which lists only `catalogue.ts`, `sessions.ts`, `types/sessions.ts` and the test - but step 4's "keep the summary in the store each time it moves" has no other moment than the end of a turn, which is where the checkpoint is taken. (2) The kind is read from the persisted worktree record (`worktreeOf(uri) !== undefined`) and not from an `isolation: worktree` config value, because in this host the config only ever reaches a running session and the record is what outlives a restart; the reference host reads its persisted `configValues[Isolation]`. (3) `summaryKept` passes `idOf(uri)` where the port's other readers pass the channel URI, because the checkpoints are committed under `refs/agents/<id>`; measured, the URI gets the edit tracker's empty answer instead of the checkpoints. (4) A session the host has never measured still falls back to the directory's counts, which is how a session listed from a backend's own record has counts at all. Fault to report, not fixed: `changes.ts` reads a session's files under two keys - `state` is reached with the channel URI (`at.owner`, which is also what `observe` keys the tracker by) while `sessionSummary` is reached with the id - so a live session's `session` scope never sees the checkpoints and a row's counts never see the tracker, and the plan's own risk note for a folder that is not a repository leans on the tracker. No task says which spelling is canonical. `packages/sdk/test/fixtures/wire.jsonl` is dirty from the suite; restore it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
