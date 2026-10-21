---
title: The computer listing and channel take the owner filter
status: implemented
depends: []
layer: plugin
refs:
  - "[code://packages/computer/src/provider.ts#L353-L357](../../../../packages/computer/src/provider.ts#L353-L357) - `list` on `computer://`"
  - "[code://packages/computer/src/catalogue.ts#L29-L44](../../../../packages/computer/src/catalogue.ts#L29-L44) - the records channel"
  - "[code://packages/sdk/src/types/computers.ts#L158](../../../../packages/sdk/src/types/computers.ts#L158) - `KeptFor`"
---

## Objective

`computer://?owner=me` and the `x-ahpd-computers` channel with `?owner=me` answer only the caller's machines.

## Files

- `UPDATE: packages/computer/src/provider.ts:353-357` - read the query with `ownerFilter` and filter the machines.
- `UPDATE: packages/computer/src/catalogue.ts:29-44` - give `ownerOf` to `recordsChannel`.
- `UPDATE: packages/computer/test/catalogue.test.ts` - the cases below.

## Steps

1. Find where the runtime keeps the owner of a machine, and read it for one id.
2. In `list` on `computer://`, read the query with `ownerFilter` and the reader.
3. With an owner, keep only the machines whose owner equals it.
4. In the catalogue, give `ownerOf` to `recordsChannel` with the same owner.
5. Add a case with two people, where each listing has only that person's machines.
6. Add a case where the channel with `?owner=me` has only the caller's machines.
7. Run the computer tests, and set this task and the plan row to `implemented`.

## Validation

- The computer tests pass, on CI or with a longer timeout.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** `list` on `computer://` takes the reader and reads the URI's query with `ownerFilter`. With `?owner=me` it keeps the machines whose `runtime.owner(id)` is the caller. `splitResource` already keeps the query, so the provider's own `At` now carries it. The catalogue gives `ownerOf` to `recordsChannel`, read off the status the channel already holds with `claimedOf`. A subscription to `x-ahpd-computers://?owner=me` is the caller's machines in its snapshot and in every diff. `catalogue.test.ts` has the two-people provider case, with an ownerless machine in the plain listing and in no filtered one, and the filtered channel case.
- **Next action:** the plan's gates and its index row.
- **Open questions:** none.
- **Watch out for:** a write to `computer://<name>/state` carries no query. A machine made before owners were kept has no owner, so it is in no filtered listing. The channel's `ownerOf` reads the status record, so a runtime whose `inspect` holds no `Config.Labels` has no owner there either.
