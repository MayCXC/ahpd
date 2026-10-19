---
title: null clears pool and cap
status: implemented
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/policies.ts#L212-L224](../../../../packages/sdk/src/policies.ts#L212-L224) - the two checks to change"
  - "[code://packages/sdk/src/policies.ts#L77-L81](../../../../packages/sdk/src/policies.ts#L77-L81) - `edgeOf`, the pattern"
---

## Objective

`checkPolicy` reads `null` for `pool` and `cap` as absent, so a put removes them.

## Files

- `UPDATE: packages/sdk/src/policies.ts:212-224` - accept `null` for `pool` and `cap`, and leave the field out of the row.
- `UPDATE: packages/sdk/test/policy-scheme.test.ts` - a put with `null` removes each field.
- `UPDATE: docs/sdk/POLICY.md` - one sentence in The scheme: `null` removes `from`, `until`, `limits`, `pool`, `cap` and a match list.

## Steps

1. Change the `pool` check to accept `undefined`, `null` or a string.
2. Change the `cap` check to accept `undefined`, `null` or a boolean.
3. Read the schema that `describe` answers, and let `pool` and `cap` take `null` there if it refuses it.
4. Write a test: put a row with a pool and a cap, put `null` for each, and read the row.
5. Write a test that `pool: 5` is still refused.
6. Add the sentence to `docs/sdk/POLICY.md`.
7. Set this task and the plan row to `implemented`.

## Validation

- Test that a put with `pool: null` gives a row with no `pool`.
- Test that a put with `cap: null` gives a row with no `cap`.
- Test that the host refuses a `pool` that is not a string or `null`.
- Run the gates.

## Resume

- **Done so far:** `checkPolicy` reads `null` for `pool` and `cap` as absent, the way `edgeOf` reads the ends of a window. The row it answers leaves the field out. In the manifest, `nullable` adds `null` to the type of every field the check reads it for. So a form that validates a body does not refuse a `null` the check accepts. `docs/sdk/POLICY.md` says a field sent as `null` is removed. The tests are in `packages/sdk/test/policy-scheme.test.ts`. `removes a pool and a cap a put sends as null` sends `null` for each field and reads the row back after each write. `still refuses a pool that is not a string or null, and a cap that is not a boolean` covers the two refusals. The last assertions of `accepts each kind's own body and refuses a choice the kind does not take` cover the schema. The file passes 21 tests, and `packages/sdk/test/policies.test.ts` passes 26.
- **Next action:** none for this task; task 02 follows.
- **Open questions:** none.
- **Watch out for:** `from`, `until`, `limits` and the lists under `match` take `null` in the manifest too. The check already removed them on `null`, and the doc sentence names them.
