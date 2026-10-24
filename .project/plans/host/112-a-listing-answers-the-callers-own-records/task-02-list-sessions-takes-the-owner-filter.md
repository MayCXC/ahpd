---
title: listSessions takes the owner filter
status: done
depends: [task-01-one-helper-reads-the-owner-filter.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L836-L880](../../../../packages/sdk/src/host/sessionmethods.ts#L836-L880) - `listSessions`"
  - "[code://packages/sdk/src/host/catalogue.ts#L1068-L1077](../../../../packages/sdk/src/host/catalogue.ts#L1068-L1077) - `allRows`"
  - "[code://packages/sdk/src/types/sessions.ts#L199](../../../../packages/sdk/src/types/sessions.ts#L199) - `SessionStore.owner`"
  - "[code://packages/sdk/test/sessions.test.ts](../../../../packages/sdk/test/sessions.test.ts) - the listing cases"
---

## Objective

`listSessions` with `_meta: {'ahpd.owner': 'me'}` answers only the sessions the caller owns.
Paging works on the filtered rows.

## Files

- `UPDATE: packages/sdk/src/host/sessionmethods.ts:836-880` - read `_meta['ahpd.owner']` and filter the rows before paging.
- `UPDATE: packages/sdk/test/sessions.test.ts` - the cases below.
- `UPDATE: docs/sdk/SESSIONS.md` - say that `listSessions` takes `_meta['ahpd.owner'] = 'me'`.

## Steps

1. In `listSessions`, read `_meta['ahpd.owner']` and give it to `ownerFilter` as `owner=<value>`.
2. Answer INVALID_PARAMS when `ownerFilter` throws.
3. With an owner, keep only the rows whose `SessionStore.owner` equals it, before the cursor and the limit apply.
4. Add a case with two people, where each one gets only their own sessions.
5. Add a case where a cursor from a filtered page gives the next filtered page.
6. Add a case where no `_meta` gives every session, as now.
7. Add a case where `ahpd.owner` is `team:x` and the answer is INVALID_PARAMS.
8. Run the sdk tests, and set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass from the repository root.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** `listSessions` reads `_meta['ahpd.owner']` and hands it to `ownerFilter` with `connection.principal`. It keeps the rows whose `SessionStore.owner` equals the answer before the cursor and the limit. A value that is not `me` reaches the caller as INVALID_PARAMS. `packages/sdk/test/sessions.test.ts` has the two-people case, the no-`_meta` case, the cursor case and the `team:x` refusal, and `docs/sdk/SESSIONS.md` says what the filter does.
- **Next action:** task-03, step 1.
- **Open questions:** none.
- **Watch out for:** a kept row of a session that is not live may have no owner in the store. That row does not match the filter. The filter reads `connection.principal`, not `ownerFor(connection)`, so a root connection owns nothing and a host with no users answers no rows.
