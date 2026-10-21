---
title: A records channel takes the owner filter
status: implemented
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

- **Done so far:** `RecordsChannelOptions.ownerOf(id, record)` gives a channel the owner of one record. With it, `<channel>?owner=me` is answered; without it a channel URI with a query is refused as before. `ownerFilter` refuses any other value with INVALID_PARAMS. Reading and `mayRead` come first, and the filter narrows after them, in the snapshot and in each diff. The plain list and a filtered one hold separate state per client and person. `recordsDomain` passes `ownerOf` through. `recordschannel.test.ts` has the two-people snapshot and diff cases, the changed-hands case and the plain-and-filtered separation. It also has the readable-first case, the no-reader case, the no-`ownerOf` refusal and the invalid value.
- **Next action:** the plan's gates and its index row.
- **Open questions:** none.
- **Watch out for:** the task names `records-channel.test.ts`. The file is `packages/sdk/test/recordschannel.test.ts`. A channel with `ownerOf` accepts only a query that names `owner`; any other query stays a channel that does not exist. A filtered subscription publishes on the URI as asked, so the alias machinery is not involved.
