---
title: The connectors key takes a list
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/connectors/bindings.ts#L61-L106](../../../../packages/sdk/src/connectors/bindings.ts#L61-L106) - `bindingsOf` and `checkBindings`"
  - "[code://packages/sdk/src/host/tooling.ts#L512-L517](../../../../packages/sdk/src/host/tooling.ts#L512-L517) - the tool list's own read of the map"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L504-L519](../../../../packages/sdk/src/host/sessionconfig.ts#L504-L519) - `isAliasMap` and `mineOf`"
---

## Objective

`connectors` takes the alias map, or a list of `connectors://<adapter>/<id>` URIs.
A URI in a list has the connector's id as its alias.

## Files

- `UPDATE: packages/sdk/src/connectors/bindings.ts:61-106` - add `aliasMapOf`, and read through it in `bindingsOf` and `checkBindings`.
- `UPDATE: packages/sdk/src/host/tooling.ts:512-517` - read the session's bindings through `aliasMapOf`.
- `UPDATE: packages/sdk/src/host/sessionconfig.ts:504-519` - say a list back on the session, as a map is said back.
- `UPDATE: packages/sdk/test/connectors-bindings.test.ts` - cases for a list, a mixed list and a list with a repeated id.

## Steps

1. Write `aliasMapOf(held)`, which answers a map as it is and turns a list into a map.
2. Give each list entry the id from `bindingTarget` as its alias.
3. Skip a list entry that `bindingTarget` does not read, as `bindingsOf` skips a bad map value.
4. Keep the first entry when two list entries name one id.
5. Read the held value through `aliasMapOf` in `bindingsOf` and in `checkBindings`.
6. Read the session's bindings through `aliasMapOf` in `tooling.ts`.
7. Let `mineOf` say back a list of strings for `connectors`.
8. Export `aliasMapOf` from the sdk index beside `bindingsOf`.
9. Add the test cases.

## Validation

- `npx vitest run packages/sdk/test/connectors-bindings.test.ts` passes, with the new cases.
- A session started with `connectors: ["connectors://ap-telegram-bot/ap-telegram-bot"]` lists the Telegram tools.

## Resume
