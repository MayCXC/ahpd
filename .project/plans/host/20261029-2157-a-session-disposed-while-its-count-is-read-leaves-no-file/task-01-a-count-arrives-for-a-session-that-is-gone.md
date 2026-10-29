---
title: A count arrives for a session that is gone
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/catalogue.ts#L665-L695](../../../../packages/sdk/src/host/catalogue.ts#L665-L695) - `summaryKept`"
  - "[code://packages/sdk/test/host-catalogue.test.ts#L1467](../../../../packages/sdk/test/host-catalogue.test.ts#L1467) - the case"
---

## Objective

`summaryKept` writes a count only for a session in `sessions` or in `ctx.respawning`.
A session disposed while its count is read keeps no file.

## Files

- `UPDATE: packages/sdk/src/host/catalogue.ts:665-695` - check that the session is still here before the count is written.
- `UPDATE: packages/sdk/test/host-catalogue.test.ts:1467` - add the case.

## Steps

1. Add a case that holds the count read, disposes the session, and then releases the read.
2. Make the case expect no file for the session, and see it fail.
3. Write the count only when `sessions` or `ctx.respawning` holds the session.
4. Run the case again, and see it pass.

## Validation

- Run the new case of `host-catalogue.test.ts` before step 3, and see it fail.
- Run it after step 3, and see it pass.
- Every other case in `host-catalogue.test.ts` passes.

## Resume

Done 2026-10-29.
Every step is built, and every check the Validation names was run.

