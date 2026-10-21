---
title: One helper reads the owner filter
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/resources/records.ts#L72-L103](../../../../packages/sdk/src/resources/records.ts#L72-L103) - `splitResource`, which gives the query"
  - "[code://packages/sdk/src/utils/values.ts#L64-L65](../../../../packages/sdk/src/utils/values.ts#L64-L65) - `ownerOfPrincipal`"
---

## Objective

One sdk function reads `owner=me` and gives the owner a listing keeps.
Every listing in this plan and in plugin 52 uses it, so the filter reads the same way everywhere.

## Files

- `UPDATE: packages/sdk/src/utils/values.ts` - `ownerFilter(query, reader)`, beside `ownerOfPrincipal`.
- `UPDATE: packages/sdk/src/index.ts` - export `ownerFilter` for the plugins.
- `CREATE: packages/sdk/test/owner-filter.test.ts` - the cases below.

## Steps

1. Add `ownerFilter(query, reader)`, which reads `owner` from the query with `URLSearchParams`.
2. When the query has no `owner`, return `undefined`, which means no filter.
3. When `owner` is `me` and the reader is a person, return `ownerOfPrincipal(reader)`.
4. When `owner` is `me` and there is no reader, return a value that matches no record.
5. When `owner` has another value, throw an error that the caller answers as INVALID_PARAMS.
6. Export `ownerFilter` from the sdk index.
7. Add a test for each of steps 2 to 5.
8. Run the sdk tests, and set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass from the repository root.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a principal from a plugin gives `plugin:<name>`. The filter matches it like any other owner.
