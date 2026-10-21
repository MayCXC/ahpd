---
title: A plugin registers connector kinds
status: todo
depends: [task-02-a-registration-is-checked.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L654-L1033](../../../../packages/sdk/src/types/plugin.ts#L654-L1033) - `PluginHost`, which gets `registerConnector`"
  - "[code://packages/sdk/src/types/plugin.ts#L1143](../../../../packages/sdk/src/types/plugin.ts#L1143) - `Contribution`, which gets `connectors`"
  - "[code://packages/sdk/src/types/host.ts#L135-L142](../../../../packages/sdk/src/types/host.ts#L135-L142) - `HostOptions.channels`, the pattern for `connectorKinds`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L282](../../../../packages/sdk/src/plugins/plugins.ts#L282) - `foldHostOptions`"
---

## Objective

A plugin registers one or more connector kinds with `registerConnector`.
A kind has a name, a title, a description, a configuration schema, a list of capabilities and an `open` function.
The fold collects every kind in `HostOptions.connectorKinds`, by name.

## Files

- `CREATE: packages/sdk/src/types/connectors.ts` - `ConnectorKind`, `Capability`, `Connector` and `ConnectorOwner`.
- `UPDATE: packages/sdk/src/types/index.ts` - export the new types.
- `UPDATE: packages/sdk/src/types/plugin.ts:654-1033` - add `registerConnector(kind)` to `PluginHost`.
- `UPDATE: packages/sdk/src/types/plugin.ts:1143` - add `connectors` to `Contribution`.
- `UPDATE: packages/sdk/src/types/host.ts:135-142` - add `connectorKinds` to `HostOptions`.
- `UPDATE: packages/sdk/src/plugins/plugins.ts` - record the kind in `pluginHost`, and fold it in `foldHostOptions`.
- `UPDATE: packages/sdk/src/plugins/validate.ts` - check a kind's shape.
- `UPDATE: packages/sdk/test/plugin-fold.test.ts` - the cases below.

## Steps

1. Write `Capability` with `type`, `name`, `title`, `description` and an optional `input` schema.
2. Allow the types `receive`, `command`, `action` and `ui`, and accept any other string.
3. Write `ConnectorKind` with `name`, `title`, `description`, `schema`, `capabilities` and `open`.
4. Make `open(connector)` answer a `close` function, or nothing.
5. Write `Connector` with `id`, `kind`, `owner`, `title` and `config`.
6. Add `registerConnector` to `PluginHost`, checked against the `connectors` contract.
7. Refuse a kind whose name is not a slug, or whose schema is not an object.
8. Refuse a second kind with the same name, from the same plugin or another one.
9. Fold the kinds into `HostOptions.connectorKinds`, each with the plugin that registered it.
10. Run the SDK plugin tests, and set this task and the plan row to `done`.

## Validation

- `plugin-fold.test.ts`: one plugin registers two kinds, and `connectorKinds` holds both.
- `plugin-fold.test.ts`: two plugins that register the same kind name fail, and the message names both.
- `plugin-fold.test.ts`: the host refuses a kind with no `schema`.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a capability is declared and shown; nothing in this plan runs one.
