---
title: The index exports PolicyLimits
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/index.ts#L91](../../../../packages/sdk/src/index.ts#L91) - the type export of policy.js"
  - "[code://packages/sdk/src/policy.ts#L49-L59](../../../../packages/sdk/src/policy.ts#L49-L59) - `PolicyLimits`"
---

## Objective

A client imports `PolicyLimits` from `@ahpd/sdk`.

## Files

- `UPDATE: packages/sdk/src/index.ts:91` - add `PolicyLimits` to the type export of `./policy.js`.

## Steps

1. Add `PolicyLimits` to the type export of `./policy.js` in the index.
2. Run `pnpm boundary` and `node tools/schema.mjs`.
3. Set this task and the plan row to `implemented`.

## Validation

- Run `pnpm -s typecheck`.
- Run the gates.

## Resume
