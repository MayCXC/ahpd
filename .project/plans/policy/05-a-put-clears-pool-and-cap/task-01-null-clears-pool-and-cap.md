---
title: null clears pool and cap
status: todo
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
