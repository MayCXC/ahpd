---
title: Computer and isolation come first
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1595-L1605](../../../../packages/sdk/src/host/sessionmethods.ts#L1595-L1605) - `resolveSessionConfig` merges the host's keys last"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L215-L225](../../../../packages/sdk/src/host/sessionconfig.ts#L215-L225) - a running session's schema, with `hostSchema` last"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L345-L353](../../../../packages/sdk/src/host/sessionconfig.ts#L345-L353) - `sessionSchema` puts the plugin keys before the backend's"
---

## Objective

A session's settings come in this order: Computer, then Isolation and Branch, then the agent's own settings.
The new session form and a running session's schema use the same order.

## Files

- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1595-1605` - the properties are merged in the new order.
- `UPDATE: packages/sdk/src/host/sessionconfig.ts:215-225` - a running session's schema uses the new order.
- `UPDATE: packages/sdk/src/host/sessionconfig.ts:345-353` - `sessionSchema` keeps the plugin keys before the backend's.
- `CREATE: packages/sdk/test/session-config-order.test.ts` - a new test file for the order.
- `UPDATE: docs/updates/v0_14.md` - a line for the order.

## Steps

1. Write one helper that orders a properties object: `computer`, the host's keys, then the rest.
2. Keep the other plugin keys after the host's keys and before the backend's.
3. Call the helper in `resolveSessionConfig` and in the running session's schema.
4. Keep the values and the merge precedence as they are; change only the key order.
5. Add a line under 0.14 in `docs/updates/v0_14.md`.

## Validation

- `Object.keys` of the form's properties for Claude Code starts with `computer`, `isolation`, `branch`.
- A running session's `config.schema.properties` has the same order.
- A host with no computer plugin starts with `isolation`.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume

