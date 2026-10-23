---
title: The host takes a new fold
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host.ts#L156-L203](../../../../packages/sdk/src/host.ts#L156-L203) - `createHost` and the agent map it builds once"
  - "[code://packages/sdk/src/host.ts#L945](../../../../packages/sdk/src/host.ts#L945) - `retool`, which rebuilds one session's tool list"
  - "[code://packages/sdk/src/host.ts#L1231](../../../../packages/sdk/src/host.ts#L1231) - a value derived from `options.events` once at start"
  - "[code://packages/sdk/src/plugins/plugins.ts#L283-L295](../../../../packages/sdk/src/plugins/plugins.ts#L283-L295) - `foldHostOptions`"
---

## Objective

`host.replace(folded)` makes the host use a new fold of the options.
Each open session is retooled, so a tool that was added or removed shows in its next turn.

## Files

- `UPDATE: packages/sdk/src/host.ts:156-203` - hold the options in one place that `replace` swaps, and rebuild the agent map from it.
- `UPDATE: packages/sdk/src/host.ts:1231` - read each value derived from the options again when the fold changes.
- `UPDATE: packages/sdk/src/types/host.ts` - add `replace(folded)` to the `Host` interface, with its comment.
- `CREATE: packages/sdk/test/host-replace.test.ts` - the cases below.

## Steps

1. List each place in `host.ts` that copies a field of `options` at start, and each value derived from one.
2. Move each copy to a read at use, or recompute it in `replace`.
3. Write `replace(folded)`, which swaps the options and rebuilds the agent map.
4. Refuse a fold whose ports or providers differ from the ones the host holds, and keep the old fold.
5. Keep an agent that still has an open session, and leave its removal to the caller.
6. Retool every open session at the end of `replace`.
7. Make `replace` emit one event, so a channel that lists contributions sends its rows again.

## Validation

- `host-replace.test.ts` adds a tool and checks that an open session's next turn has it.
- It removes a tool, a channel and a method, and checks that each is gone.
- It gives a fold with a different port, and the host keeps the old fold.
- `npm test -w packages/sdk` passes.

## Resume

