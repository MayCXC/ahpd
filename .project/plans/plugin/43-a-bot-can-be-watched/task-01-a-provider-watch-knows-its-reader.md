---
title: A provider's watch knows its reader
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/resourcemethods.ts#L102-L134](../../../../packages/sdk/src/host/resourcemethods.ts#L102-L134) - `createResourceWatch`"
  - "[code://packages/sdk/src/host/admission.ts#L231-L253](../../../../packages/sdk/src/host/admission.ts#L231-L253) - `excusedBy`"
  - "[code://packages/sdk/src/host/gate.ts#L252-L259](../../../../packages/sdk/src/host/gate.ts#L252-L259) - `channelRead`"
  - "[code://packages/sdk/src/host/root.ts#L21-L45](../../../../packages/sdk/src/host/root.ts#L21-L45) - `schemeOperations`"
---

## Objective

A provider's `watch` gets the reader, and `authorize` can let a watch through.
A watch channel is gated by its root's scheme, and `operations` names `watch`.

## Files

- `UPDATE: packages/sdk/src/types/resources.ts:211-215` - `watch` takes an optional fourth argument, `reader?: Principal`.
- `UPDATE: packages/sdk/src/host/resourcemethods.ts:102-134` - `createResourceWatch` passes `connection.principal`.
- `UPDATE: packages/sdk/src/host/admission.ts:231-253` - `excusedBy` asks `authorize` for `createResourceWatch`, and excuses `<scheme>:watch`.
- `UPDATE: packages/sdk/src/host/gate.ts:252-259` - a resource watch channel needs `<scheme>:watch` for the scheme of its root.
- `UPDATE: packages/sdk/src/host/root.ts:21-45` - `ORDER` has `watch`, so a provider with `watch` advertises it.
- `UPDATE: packages/sdk/src/types/resources.ts:277-285` - the comment on `authorize` names the watch.
- `UPDATE: packages/sdk/test/watches.test.ts` - cases for the reader, `authorize` and the channel grant.

## Steps

1. Add `reader?: Principal` as the fourth parameter of `watch` in `ResourceStore`.
2. Pass `connection.principal` as that argument in `createResourceWatch`.
3. Treat `createResourceWatch` as the operation `watch` in `excusedBy`.
4. Find the root of a watch channel from `ctx.watches` in `channelRead` or its caller.
5. Require `<scheme>:watch` for that root's scheme, and keep `file:watch` for a `file:` root.
6. Add `watch` to `ORDER` in `schemeOperations`.
7. Name the watch in the comment on `authorize`.

## Validation

- A test provider's `watch` receives the principal of the connection that asked.
- A reader with no `bot:watch` and an `authorize` that answers `true` gets a channel.
- A reader with `bot:watch` and no `file:watch` subscribes to that channel.
- Make sure the gate refuses that channel to a reader with `file:watch` and no `bot:watch`.
- `ahpd.resourceProviders` lists `watch` for a provider that has it.
- `pnpm exec vitest run packages/sdk` passes, and the file watch tests do not change.

## Resume
