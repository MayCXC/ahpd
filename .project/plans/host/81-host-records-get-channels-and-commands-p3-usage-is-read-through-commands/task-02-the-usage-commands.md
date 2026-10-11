---
title: The usage commands answer what the usage reads answer
status: todo
depends: [task-01-each-usage-read-answers-a-value.md]
layer: "packages/sdk, packages/server"
refs:
  - "[code://packages/sdk/src/usage.ts#L763-L782](../../../../packages/sdk/src/usage.ts#L763-L782) - the pools a reader may read"
  - "[code://packages/server/src/commands/run.ts#L726-L734](../../../../packages/server/src/commands/run.ts#L726-L734) - the usage provider in `run.ts`"
---

## Objective

`x-ahpd/usage/pools`, `totals`, `range`, `records` and `groups` answer typed values, with the same reader rules as the `usage:` scheme.

## Files

- `UPDATE: packages/sdk/src/usage.ts` - `usageMethods(provider)`, the five served methods.
- `UPDATE: packages/sdk/src/index.ts` - export `usageMethods`.
- `UPDATE: packages/server/src/commands/run.ts:726-734` - pass the methods as `HostOptions.methods`.
- `CREATE: packages/sdk/test/usage-methods.test.ts` - each command beside its read.

## Steps

1. Give each method the grant `usage:read`.
2. Give `pools` and `groups` an `authorize` that lets in every signed-in reader, as the scheme does.
3. Give `totals`, `range` and `records` an `authorize` that lets in a reader for their own pools.
4. Answer `pools` with the pools the reader may read, each with its kind and name.
5. Read `pool`, `from`, `until` and `by` from the params, and refuse a value of the wrong type.
6. Count only the records the reader may read in `groups`, as `usage://groups` does.
7. Add the methods to `HostOptions.methods` in `run.ts`, beside the usage provider.

## Validation

- `usage-methods.test.ts` compares each command with the JSON of its read, for an admin and a member.
- The host refuses a member who asks `totals` for another person's pool.
- A `from` that is not a date gets the sentence the read gives.
- `pnpm exec vitest run packages/sdk packages/server` passes.

## Resume

