---
title: The creator's tools are there on the first turn
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L817-L852](../../../../packages/sdk/src/host/sessionmethods.ts#L817-L852) - `createSession`, which opens the session and then records the creator"
  - "[code://packages/sdk/test/presence.test.ts](../../../../packages/sdk/test/presence.test.ts) - the presence tests"
---

## Objective

A session made with an `activeClient` has that client's tools in its first `boundTools`.
This holds for every backend, because the host records presence before the backend opens the session.

## Files

- `UPDATE: packages/sdk/src/host/sessionmethods.ts:817-852` - record the creator before `openSession`, and remove it again if `openSession` throws.
- `UPDATE: packages/sdk/test/presence.test.ts` - the cases below.

## Steps

1. Build the creator's `activeClient` before `openSession`, as the code does now after it.
2. Put the creator in `presence` before `openSession`.
3. Remove the creator from `presence` if `openSession` throws, and remove the empty map with it.
4. Keep the `session/activeClientSet` dispatch and `retool` after `openSession`, because `retool` also sets the plugins.
5. Move the comment with the code, and say why presence comes first.

## Validation

- A Claude session made with a client tool offers that tool in its first `boundTools`.
- A create whose `openSession` throws leaves no presence behind.
- `pnpm exec vitest run packages/sdk` passes.

## Resume
