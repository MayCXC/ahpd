---
title: The counts move at each tool call
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L1181-L1184](../../../../packages/sdk/src/host/spawn.ts#L1181-L1184) - where a finished tool call is seen"
  - "[code://packages/sdk/src/host/catalogue.ts#L648-L662](../../../../packages/sdk/src/host/catalogue.ts#L648-L662) - `summaryKept`"
  - "[code://packages/sdk/src/host/facts.ts#L346-L370](../../../../packages/sdk/src/host/facts.ts#L346-L370) - `refreshWatched`, the coalescing to copy"
  - "[code://packages/sdk/src/sessions/changes.ts#L747-L767](../../../../packages/sdk/src/sessions/changes.ts#L747-L767) - the session kind's counts"
  - "[code://packages/sdk/src/sessions/checkpoints.ts#L124-L128](../../../../packages/sdk/src/sessions/checkpoints.ts#L124-L128) - `baselineOf`"
---

## Objective

A session row's counts move at each finished tool call, not only at a turn's end.
During a turn, the session kind counts from its baseline to the working tree.

## Files

- `UPDATE: packages/sdk/src/host/spawn.ts:1181-1184` - a finished tool call also asks `summaryKept`.
- `UPDATE: packages/sdk/src/host/catalogue.ts:648-662` - `summaryKept` is coalesced per session, and tells the source a turn is running.
- `UPDATE: packages/sdk/src/types/changes.ts:367` - `sessionSummary` gains `running?`.
- `UPDATE: packages/sdk/src/sessions/changes.ts:1580` - with `running`, the counts are the baseline against the working tree.
- `UPDATE: packages/sdk/test/changes-refresh.test.ts` - the row moves during a turn, for both kinds.
- `UPDATE: CHANGELOG.md` - a row's counts move while a turn runs.

## Steps

1. Call `summaryKept(uri)` at each `chat/toolCallComplete`, beside `refreshWatched`.
2. Coalesce `summaryKept` per session to one read running and one waiting, as `refreshWatched` does.
3. Add `running?: boolean` to `sessionSummary`, and pass `true` from a tool call.
4. With `running`, answer `branchLook` against the session's baseline, and the checkpoints answer otherwise.
5. Fall back to the edit tracker where the session has no baseline.
6. Keep the turn's end as it is, so the checkpoint answers once the turn ends.
7. Add the tests to `changes-refresh.test.ts`.
8. Update the CHANGELOG.
9. Set this task and its plan row to `implemented`.

## Validation

- A worktree session's row moves after a tool call writes a file, before the turn ends.
- A session in a folder moves the same way, from its baseline.
- A burst of ten tool calls runs at most two reads for one session.
- A tool call that changes nothing sends no `root/sessionSummaryChanged`.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm test` pass.

## Resume

