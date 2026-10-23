---
title: An action is a host tool
status: todo
depends:
  - task-01-an-adapter-runs-an-action.md
  - task-02-a-session-names-its-connectors.md
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/types/host.ts#L145-L152](../../../../packages/sdk/src/types/host.ts#L145-L152) - `HostOptions.adapters`, what the tools are built from"
  - "[code://packages/sdk/src/host/tooling.ts#L379-L395](../../../../packages/sdk/src/host/tooling.ts#L379-L395) - `permitted` and `contributed`"
  - "[code://packages/sdk/src/host/tooling.ts#L440-L463](../../../../packages/sdk/src/host/tooling.ts#L440-L463) - `contributingTo` and `shapedDefinition`"
  - "[code://packages/sdk/src/host.ts#L1242-L1247](../../../../packages/sdk/src/host.ts#L1242-L1247) - `setTools`, which must keep the action tools"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1358](../../../../packages/sdk/src/host/lifecycle.ts#L1358) - `principalFor` of a session's owner"
  - "[code://packages/server/src/commands/run.ts#L702-L720](../../../../packages/server/src/commands/run.ts#L702-L720) - the connectors channel the daemon builds"
---

## Objective

The host offers one tool for each `action` capability of each adapter that has `run`.
A session sees the tool only with a compatible binding, and a call runs on the bound connector after the live check.

## Files

- `CREATE: packages/sdk/src/connectors/actions.ts` - `actionTools(adapters, run)`, which builds the tools.
- `UPDATE: packages/sdk/src/types/host.ts` - `HostOptions.connectors?: { run: ConnectorsChannel['run'] }`.
- `UPDATE: packages/sdk/src/host/tooling.ts:379-395` - keep the action tools beside `contributed`, and add them to `contributing`.
- `UPDATE: packages/sdk/src/host.ts:1242-1247` - `setTools` keeps the action tools.
- `UPDATE: packages/server/src/commands/run.ts` - pass `connectors: { run: connectorLists.run }`.
- `CREATE: packages/sdk/test/connector-actions.test.ts` - the cases below.

## Steps

1. Write `actionTools` in the new file.
2. Name each tool `<adapter>_<action>`, and write each character outside `[A-Za-z0-9_]` as `_`.
3. Keep the first tool of a name, and report the second through the host's problem log.
4. Use the capability's `input` as the schema, with a `connector` string property added.
5. Use the capability's `description` as the tool's description.
6. Give each tool a `forSession` that reads its `bindings` argument for its adapter.
7. Answer `{ offered: false }` when no binding is of the tool's adapter.
8. With one binding, answer a definition with no `connector` property.
9. With two or more, answer a required `connector` with an `enum` of the aliases.
10. In `run`, take `connector` from the input, or the one binding when the input has none.
11. Answer an error when the alias is not in `sessionBindings` for this adapter at the call.
12. Call `connectors.run(id, principalFor(owner), action, input)` without the `connector` key.
13. Answer an error that names the alias and the reason when `run` throws.
14. Build the action tools once from `options.adapters`, when the host starts.
15. Add the tests, and run the sdk and server tests.

## Validation

- `connector-actions.test.ts`: a session with one binding sees the tool with no `connector`, and a call reaches `adapter.run` on that connector.
- `connector-actions.test.ts`: a session with two bindings sees one tool, with an `enum` of two aliases.
- `connector-actions.test.ts`: a session with no binding of the adapter does not see the tool or its instruction.
- `connector-actions.test.ts`: an alias that is not bound answers an error, and `adapter.run` is not called.
- `connector-actions.test.ts`: a call after a remove of the connector answers an error.
- `connector-actions.test.ts`: `setTools` keeps the action tools.
- `connector-actions.test.ts`: no answer or error holds a secret value.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume
