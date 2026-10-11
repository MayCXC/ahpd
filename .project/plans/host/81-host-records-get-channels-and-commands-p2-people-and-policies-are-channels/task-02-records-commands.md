---
title: A record is put and removed by command, with the rules a resource write has
status: done
depends: [task-01-a-records-channel.md]
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/records.ts#L162-L244](../../../../packages/sdk/src/records.ts#L162-L244) - `recordsProvider.write` and `remove`, whose rules move to two functions"
---

## Objective

`x-ahpd/<domain>/put` and `x-ahpd/<domain>/remove` change a record through the same rules as `resourceWrite` and `resourceDelete`, and the channel hears both paths.

## Files

- `UPDATE: packages/sdk/src/records.ts:162-244` - `putRecord` and `removeRecord`, which `write` and `remove` call; an optional `changed` callback.
- `UPDATE: packages/sdk/src/recordschannel.ts` - `recordsMethods`, the two served methods.
- `UPDATE: packages/sdk/test/recordschannel.test.ts` - cases for the commands.

## Steps

1. Move the body of `recordsProvider.write` into `putRecord(scheme, records, id, body, createOnly)`.
2. Move the body of `recordsProvider.remove` into `removeRecord(scheme, records, id)`.
3. Call the two functions from `write` and `remove`, and keep every refusal sentence.
4. Give `recordsProvider` an optional `changed` callback, and call it after each write and remove.
5. Write `recordsMethods(domain, scheme, records, refresh)` that answers the `put` and `remove` methods.
6. Read `id`, `record` and `createOnly` from the `put` params.
7. Refuse a missing id, and a record that is not an object.
8. Call `refresh` after each command.

## Validation

- A `put` with the body a resource write refuses gets the same sentence.
- The host refuses a `put` with `createOnly` over an existing id.
- A resource write through the provider calls `changed`.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

Implemented 2026-10-11. `putRecord` and `removeRecord` are in `records.ts`, and `recordsMethods` and `recordsDomain` in `recordschannel.ts`. Both commands answer `{}`, as a resource write does, so a caller with `put` and no `read` gets no record back. An id with a `/` or a `?` is refused, and so is a missing `record`. A resource write now parses the body before it checks `createOnly`.
