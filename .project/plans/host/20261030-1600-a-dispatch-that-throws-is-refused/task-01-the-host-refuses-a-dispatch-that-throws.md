---
title: The host refuses a dispatch that throws
status: todo
depends: []
layer: host
refs:
  - "[code://packages/sdk/src/host.ts#L1703-L1775](../../../../packages/sdk/src/host.ts#L1703-L1775) - `applyNow`, `behind` and `dispatchAction`"
  - "[code://packages/sdk/test/automations.test.ts#L1699-L1735](../../../../packages/sdk/test/automations.test.ts#L1699-L1735) - the case that reads the store's refusal"
---

## Objective

A dispatch applied at once whose apply throws is logged and refused to its sender with the error's message.
The refusal comes from the same code that refuses a dispatch that failed while it waited.

## Files

- `UPDATE: packages/sdk/src/host.ts:1703-1775` - the log line and the refusal in `behind`'s catch become a function of their own, which `behind` and `dispatchAction` both call.
- `UPDATE: packages/sdk/test/automations.test.ts:1699-1735` - the store's refusal read off the client's peer, and a case that sends a write the store refuses through `receive`.

## Steps

1. Write the case that sends a write the store refuses through `receive`.
2. Run it on the host as it is, and see that the wire carries no refusal.
3. Move the log line and the refusal out of `behind`'s catch into a function of their own.
4. Catch a throw from `applyNow` in `dispatchAction`, and refuse it through that function.
5. Read the store's refusal off the peer in the case that asserted `handle` rejecting.

## Validation

- `packages/sdk/test/automations.test.ts`: the new case fails before the change and passes after it.
- `packages/sdk/test/session-fixed-key.test.ts`: a throw in a dispatch that waited is still refused to its sender.
- `pnpm run typecheck` reports no errors.

## Resume

Not started.
