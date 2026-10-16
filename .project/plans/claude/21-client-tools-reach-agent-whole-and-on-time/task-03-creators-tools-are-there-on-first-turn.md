---
title: The creator's tools are there on the first turn
status: done
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

Built by `host/83 p3`, and no source change was needed here. `createSession` in `packages/sdk/src/host/sessionmethods.ts` already builds the creator's `activeClient`, writes it into `presence` before `openSession`, takes it out again in a `catch` around the call, and dispatches `session/activeClientSet` and `retool` after it. That was the code `host/83 p3 t02` added, for the instruction a session sent from a window has to carry on its first turn; this task is the same change seen from the tool list, so the four steps and the rollback were in place.

The task added only the two cases the Validation asks for, which did not exist:

- `born` on the presence test's `watched` backend, which records the tool names each chat was handed as it started - the list it is born with, which is what the first turn reaches.
- `offers a tool the creator brought on the session's first turn` - a create with an `activeClient` puts `creator__openFile` in the backend's first list. This fails on the code before `host/83 p3`, where the creator went in after `openSession` and the first list was empty.
- `takes the creator back out when the session never opens` - a create whose `openSession` throws leaves nothing behind. The same client making the session again, for real this time, still hands its tool to the chat; a presence left by the failed create would make the second announcement read as one already made and the tool would never be handed over.

`watched` gained an optional backend argument, so the second case can give it one that refuses once.

Files this task changed:

- `packages/sdk/src/host/sessionmethods.ts` - not changed: `host/83 p3` put the creator in before `openSession`, with the rollback.
- `packages/sdk/test/presence.test.ts` - `born` on `watched`, an optional backend argument, and the two cases.
