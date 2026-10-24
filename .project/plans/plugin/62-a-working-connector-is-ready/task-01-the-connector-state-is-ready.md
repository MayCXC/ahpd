---
title: The connector state is ready
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/connectors/channel.ts#L79](../../../../packages/sdk/src/connectors/channel.ts#L79) - `ConnectorState`"
  - "[code://packages/sdk/src/connectors/channel.ts#L252-L258](../../../../packages/sdk/src/connectors/channel.ts#L252-L258) - `stateOf`"
  - "[code://docs/plugins/PLUGINS.md#L1170-L1174](../../../../docs/plugins/PLUGINS.md#L1170-L1174) - the state table"
---

## Objective

A connector row that the host started has `state: 'ready'`, and the docs name the state `ready`.

## Files

- `UPDATE: packages/sdk/src/connectors/channel.ts` - `ConnectorState` and `stateOf` say `ready` in place of `open`.
- `UPDATE: packages/sdk/test/connectors-channel.test.ts` - the expected state is `ready`.
- `UPDATE: packages/sdk/test/users-host.test.ts` - the expected state is `ready`.
- `UPDATE: packages/webhook/test/webhook-kind.test.ts` - the expected state is `ready`.
- `UPDATE: docs/plugins/PLUGINS.md` - the state table, and "it is open" and "not open" where they name the state.
- `UPDATE: docs/plugins/WEBHOOKS.md:49` - "not open yet" becomes "not ready yet".

## Steps

1. Change `ConnectorState` to `'ready' | 'invalid' | 'unavailable'`.
2. Make `stateOf` answer `ready` for a connector that the host started.
3. Search the sdk, server and plugin sources for a comparison with the state `open`, and change each one to `ready`.
4. Change each test that expects `state: 'open'` to expect `state: 'ready'`.
5. Change the `open` row of the state table in `PLUGINS.md` to `ready`.
6. Change each sentence in the docs that names the state `open` to name `ready`.
7. Keep `Adapter.open` and each sentence where "open" is the act of starting a connector.

## Validation

- `rg -n "'open'" packages/sdk/src/connectors packages/server/src` finds no connector state.
- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.

## Resume
