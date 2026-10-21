---
title: The computer listing and channel take the owner filter
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** `runtime.list()` may not carry the owner. Then read it from the kept record of each machine.
