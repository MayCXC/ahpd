---
title: Each usage read answers a value, and the scheme gives it as text
status: implemented
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/usage.ts#L664-L740](../../../../packages/sdk/src/usage.ts#L664-L740) - `rangeOf`, `keysAsked`, `groupsBody` and `body`"
---

## Objective

The usage provider builds each answer as a value from typed arguments, and `read` and `resolve` turn that value into text.

## Files

- `UPDATE: packages/sdk/src/usage.ts:664-740` - typed answer functions, and the query read once into their arguments.
- `UPDATE: packages/sdk/test/usage.test.ts` - the existing reads still answer the same text.

## Steps

1. Write `periods(pool)`, `range(pool, from, until)`, `records(pool, from, until)` and `groups(by, from, until, reader)`.
2. Give each the defaults `rangeOf` gives, in the provider's zone.
3. Keep the refusal sentences of `rangeOf` and `keysAsked`.
4. Make `body` and `groupsBody` call the new functions and give their JSON text.
5. Return the functions from `usageProvider` as `answers`, for task 02.

## Validation

- Every test in `usage.test.ts` passes with no change to an expected text.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

Implemented 2026-10-11. `usageProvider` returns `answers`: `periods`, `range`, `records` and `groups`, with `pools` and `readable` beside them for task 02. `bounds` and `keysFrom` hold the refusal sentences `rangeOf` and `keysAsked` had. `body` and `groupsBody` give the answers as the same JSON text, and every test in `usage.test.ts` and `usage-scheme.test.ts` passes unchanged.
