---
title: The periods are one module, and the store keeps its days in the usage timezone
status: done
depends: []
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/usage.ts#L96-L108](../../../../packages/sdk/src/usage.ts#L96-L108) - `FileUsageOptions`, which has no zone"
  - "[code://packages/sdk/src/usage.ts#L145-L156](../../../../packages/sdk/src/usage.ts#L145-L156) - `dayOf`, the UTC day a record is kept under"
  - "[code://packages/sdk/src/usage.ts#L288-L330](../../../../packages/sdk/src/usage.ts#L288-L330) - `today`, `record` and `total`, which compare UTC days"
  - "[code://packages/sdk/src/usage.ts#L566-L640](../../../../packages/sdk/src/usage.ts#L566-L640) - `shown`, `offsetAt`, `startOfDay`, `zoneOf`, `mondayOf` and `firstOf`"
  - "[code://packages/sdk/src/usage.ts#L766-L770](../../../../packages/sdk/src/usage.ts#L766-L770) - `spansOf`, the periods of the usage scheme"
  - "[code://packages/server/src/commands/run.ts#L348](../../../../packages/server/src/commands/run.ts#L348) - `fileUsage`, made with no zone"
  - "[code://packages/server/src/commands/run.ts#L872](../../../../packages/server/src/commands/run.ts#L872) - `usageTimezone`, given to the usage scheme only"
---

## Objective

One sdk module answers the start of the current day, week and month in a zone, and the start of the next one.
`fileUsage` keeps its totals per day in that zone, so a period's total holds only the records inside it.

## Files

- `CREATE: packages/sdk/src/periods.ts` - `zoneOf`, `periodOf(zone, period, now, from?)` answering `{ from, resets? }`, and the zoned helpers out of `usage.ts`.
- `UPDATE: packages/sdk/src/usage.ts:96-108` - `timezone?: string` in `FileUsageOptions`.
- `UPDATE: packages/sdk/src/usage.ts:145-330` - the day a record is kept under and the days `total`, `records` and `groups` compare are days in the zone.
- `UPDATE: packages/sdk/src/usage.ts:566-640` - the helpers move to `periods.ts`, and `usageProvider` imports them.
- `UPDATE: packages/sdk/src/usage.ts:766-770` - `spansOf` reads its spans from `periodOf`.
- `UPDATE: packages/server/src/commands/run.ts:348` - `fileUsage` gets `options.usageTimezone`.
- `UPDATE: packages/sdk/test/usage.test.ts` - the zoned days.

## Steps

1. Move `shown`, `offsetAt`, `startOfDay`, `zoneOf`, `mondayOf` and `firstOf` to `periods.ts` without a change to what they answer.
2. Write `periodOf(zone, period, now, from?)` for `day`, `week`, `month` and `total`.
3. For `day`, `week` and `month`, answer `from` as the period's start and `resets` as the next period's start.
4. For `total`, answer `from` as the row's `from`, or the epoch when it has none, and no `resets`.
5. Make `spansOf` in `usageProvider` read its three spans from `periodOf`.
6. Add `timezone` to `FileUsageOptions` and resolve it once with `zoneOf`, reporting a bad zone through `onProblem`.
7. Key each record's day by the wall clock in the zone, through `shown`, in `dayOf`.
8. Compare `from` and `until` as days in the zone in `total`, `records` and `groups`.
9. Keep the file name on the record's UTC month, so the files on disk do not move.
10. Pass `options.usageTimezone` to `fileUsage` in `run.ts`.

## Validation

- `packages/sdk/test/usage.test.ts`: with `America/Campo_Grande`, a record at Sunday 23:00 local is out of the week that starts the next Monday.
- `packages/sdk/test/usage.test.ts`: a record at Monday 01:00 local is in that week, and in Monday's day total.
- `packages/sdk/test/usage.test.ts`: with no zone, the totals are what they were, per UTC day when the system zone is UTC.
- A new `packages/sdk/test/periods.test.ts`: `periodOf` answers each period's start and reset, across a month's end and a year's end.
- `pnpm -s typecheck` and vitest over `packages/sdk` pass.

## Resume

Implemented 2026-10-17, not reviewed.

- `packages/sdk/src/periods.ts` holds the zoned helpers out of `usage.ts`, without a change.
- `periodOf` answers `{ from, resets? }` for `day`, `week`, `month` and `total`.
- `fileUsage` resolves `timezone` once, and keeps each record under its day in that zone.
- `total`, `records` and `groups` compare `from` and `until` as days in that zone.
- A bare date is the day it names, and an instant is the day it falls on in the zone.
- The file a record goes in is still named by its UTC month.
- `spansOf` reads its three starts from `periodOf`.
- `run.ts` gives `fileUsage` the zone.

Outside the task's Files: `packages/server/src/commands/usage.ts` gives the store of `ahpd usage` the same zone.
Without it, that store keeps days in the system zone while its provider cuts periods in the configured one.

Tests: `periods.test.ts` is new, and covers the end of a month and the end of a year.
`usage.test.ts` has the zoned cases in `America/Campo_Grande`, and the file of a record at the end of a month.
Three earlier cases written in UTC days now name `timezone: 'UTC'`.
One case runs only when the system zone is UTC, because no zone means the system's own.
`usage-scheme.test.ts` gives the store and the provider the same zone, as `run.ts` does.
