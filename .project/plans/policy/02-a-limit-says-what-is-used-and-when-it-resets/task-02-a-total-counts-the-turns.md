---
title: A total counts the turns
status: implemented
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/usage.ts#L81-L84](../../../../packages/sdk/src/types/usage.ts#L81-L84) - `ModelUse`, the record a turn writes"
  - "[code://packages/sdk/src/types/usage.ts#L104-L131](../../../../packages/sdk/src/types/usage.ts#L104-L131) - `UsageTotal`, which has `calls` and no `turns`"
  - "[code://packages/sdk/src/usage.ts#L158-L199](../../../../packages/sdk/src/usage.ts#L158-L199) - `measured`, what one record adds to a total"
  - "[code://packages/sdk/src/meter.ts#L218-L265](../../../../packages/sdk/src/meter.ts#L218-L265) - `write`, the one place a turn's record is made"
  - "[code://packages/sdk/src/meter.ts#L267-L325](../../../../packages/sdk/src/meter.ts#L267-L325) - `per: 'turn'` writes once at the end, `per: 'report'` writes each report"
---

## Objective

A turn's first record says that it opens the turn, and a total counts those records as `turns`.
With `per: 'turn'` or `per: 'report'`, one turn is one in `turns`.

## Files

- `UPDATE: packages/sdk/src/types/usage.ts:81-84` - `opens?: true` on `ModelUse`: the first record the meter writes for its turn.
- `UPDATE: packages/sdk/src/types/usage.ts:104-131` - `turns?: number` in `UsageTotal`.
- `UPDATE: packages/sdk/src/usage.ts:158-199` - `measured` adds 1 to `turns` for a record with `opens`, and `addTo`, `none` and `reported` carry the field.
- `UPDATE: packages/sdk/src/meter.ts:218-325` - `write` sets `opens` on the first record of a turn.
- `UPDATE: packages/sdk/test/usage-meter.test.ts` - the turn count in both modes.
- `UPDATE: packages/sdk/test/usage.test.ts` - `turns` in a total.

## Steps

1. Add `opens?: true` to `ModelUse`, with a comment that says it marks the first record the meter writes for its turn.
2. Add `turns?: number` to `UsageTotal`, absent when nothing opened a turn, as the other measures are.
3. Count 1 in `turns` for a record with `opens` in `measured`, and 0 for any other record.
4. Keep a flag on `Held` for whether the turn has had a record in the meter.
5. Set `opens: true` on the first record `write` makes for a turn, in both modes.
6. Leave the proxy's records without `opens`, because a proxy call is not a turn.

## Validation

- `packages/sdk/test/usage-meter.test.ts`: with `per: 'turn'`, one turn writes one record with `opens`.
- `packages/sdk/test/usage-meter.test.ts`: with `per: 'report'`, three reports write three records and only the first has `opens`.
- `packages/sdk/test/usage-meter.test.ts`: a report for a turn that never said it began opens it once.
- `packages/sdk/test/usage.test.ts`: two turns of three records each total `turns: 2` and `calls: 6`.
- `pnpm -s typecheck` and vitest over `packages/sdk` pass.

## Resume

Implemented 2026-10-17.
`ModelUse` has `opens?: true`, which marks the first record the meter wrote for its turn, and `UsageTotal` has `turns?: number`, which stays absent when no record opened a turn.
`measured` adds 1 to `turns` for a record with `opens` and 0 for any other, and `Measured`, `none`, `addTo` and `reported` carry the measure, so `total`, `groups` and the periods all answer it.
The meter keeps `Held.opened`, and `write` takes the report the record says the turn used (the turn's own sum unless a report is written on its own), so `per: 'turn'` opens the turn with its one record and `per: 'report'` opens it with its first report and no later one. A report that arrives for a turn that never said it began opens it once through the same flag. The proxy's records are untouched and carry no `opens`.

Validation: `packages/sdk/test/usage.test.ts` records two turns of three records each and reads `turns: 2`, `calls: 6`. `packages/sdk/test/usage-meter.test.ts` asserts `opens: true` on the one record of a `per: 'turn'` turn, `[true, undefined, undefined]` for a `per: 'report'` turn of three reports, and `[true, undefined]` for the reports of a turn that never said it began.
Gates: `node tools/schema.mjs`, `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `git diff --quiet tools/` and vitest over the listed packages with `--maxWorkers=2 --testTimeout=10000` all pass (311 files, 5363 tests).
Outside the task's Files: the suite rewrote `packages/sdk/test/fixtures/wire.jsonl` (host endpoint, config keys and fresh ids), as it does on every run; restore it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl` if it is not wanted in the commit.

