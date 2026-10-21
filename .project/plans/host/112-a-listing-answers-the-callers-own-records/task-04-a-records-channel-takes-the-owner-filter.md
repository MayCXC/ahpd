---
title: A records channel takes the owner filter
status: todo
depends: [task-01-one-helper-reads-the-owner-filter.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/resources/recordschannel.ts#L34-L43](../../../../packages/sdk/src/resources/recordschannel.ts#L34-L43) - `RecordsChannelOptions`, where `mayRead` already sits"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L165-L185](../../../../packages/sdk/src/resources/recordschannel.ts#L165-L185) - the subscribe path, which answers only the exact channel URI"
---

## Objective

A records channel that knows the owner of each record answers `<channel>?owner=me` with the caller's records only.
The `computer` plugin and other plugins get the filter from the sdk, not each on its own.

## Files

- `UPDATE: packages/sdk/src/resources/recordschannel.ts` - an optional `ownerOf(record)` option, and the channel with a query.
- `UPDATE: packages/sdk/test/records-channel.test.ts` - the cases below.

## Steps

1. Add an optional `ownerOf(id, record)` to `RecordsChannelOptions`, which gives the owner of one record.
2. When the channel has `ownerOf`, accept the channel URI with a query, and read it with `ownerFilter`.
3. Answer INVALID_PARAMS when `ownerFilter` throws.
4. When the channel has no `ownerOf`, refuse a URI with a query, as now.
5. For a filtered subscription, keep only the records whose `ownerOf` equals the owner, in the snapshot and in each diff.
6. Apply `mayRead` and the grant as now, before the filter.
7. Add a case with two people, where each filtered snapshot and diff has only that person's records.
8. Add a case where a channel without `ownerOf` refuses a query.
9. Run the sdk tests, and set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass from the repository root.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the name of the test file may differ. Find the records channel cases with `rg -l recordsChannel packages/sdk/test`.
