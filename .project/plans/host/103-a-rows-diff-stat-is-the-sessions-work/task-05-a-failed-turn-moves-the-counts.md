---
title: A failed turn moves the counts
status: implemented
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

- **Done so far:** built 2026-10-16. `spawn.ts`'s turn-end condition takes `chat/error` with the two endings the protocol names, so a turn that failed checkpoints its tree, has its counts read and the folder's facts re-read, as a finished turn does; the comment above it says so. 1 test in `test/host-catalogue.test.ts` (`moves a row with the work a turn did before it failed`), which fails `files: 2` to `files: 5` without the condition. Gates: `build`, `typecheck`, `boundary`, `node tools/schema.mjs` (508 definitions) and `git diff --quiet tools/` pass; sdk vitest 151 files, 2999 tests pass.
- **Next action:** [task-06-the-docs-say-what-a-row-counts.md](task-06-the-docs-say-what-a-row-counts.md).
- **Open questions:** none.
- **Watch out for:** a failure is the agent's to report, so the test ends the turn with the fake CLI's `error_during_execution` result rather than by dispatching `chat/error`, which a client may not send. The task's refs point at lines that tasks 01 and 04 have moved; the condition it means is the turn end that checkpoints, now at `spawn.ts:1016`. `packages/sdk/test/fixtures/wire.jsonl` is dirty from the suite; restore it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
