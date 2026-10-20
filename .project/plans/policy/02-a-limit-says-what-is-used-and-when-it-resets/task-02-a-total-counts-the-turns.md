---
title: A total counts the turns
status: done
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

Implemented 2026-10-17, not reviewed.

- `ModelUse` has `opens?: true`, and `UsageTotal` has `turns?: number`.
- `measured` counts 1 in `turns` for a record with `opens`, and `none`, `addTo` and `reported` carry the measure.
- The meter keeps `Held.opened`, and `write` sets `opens` on the first record of a turn only.
- `write` takes the report a record says, so `per: 'report'` keeps the flag on the turn itself.
- The proxy's records carry no `opens`.

Tests: `usage.test.ts` totals two turns of three records as `turns: 2` and `calls: 6`.
`usage-meter.test.ts` checks `opens` with `per: 'turn'`, with `per: 'report'`, and for a turn that never said it began.
