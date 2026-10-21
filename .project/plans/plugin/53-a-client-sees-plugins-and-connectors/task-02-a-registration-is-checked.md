---
title: A registration is checked against the contract
status: todo
depends: [task-01-the-manifest-is-read.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/plugins/plugins.ts#L804](../../../../packages/sdk/src/plugins/plugins.ts#L804) - `pluginHost` and `HostRecordingOptions`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1116-L1300](../../../../packages/sdk/src/plugins/plugins.ts#L1116-L1300) - the register methods, each of which calls `open()` first"
  - "[code://packages/sdk/src/plugins/validate.ts](../../../../packages/sdk/src/plugins/validate.ts) - `miss`, the error a refused registration throws"
  - "[code://packages/server/src/plugins.ts#L921-L932](../../../../packages/server/src/plugins.ts#L921-L932) - the call to `pluginHost` in `loadOne`"
---

## Objective

A plugin with `contracts` can register only the names its contracts list.
A refused registration fails the load, and the message names the plugin, the kind and the name.
A plugin with no `contracts` is not checked.

## Files

- `UPDATE: packages/sdk/src/plugins/plugins.ts:804` - add `contracts?` to `HostRecordingOptions`.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:1116-1300` - call the check in each register method, after `open()`.
- `UPDATE: packages/sdk/src/plugins/validate.ts` - add `declared(by, contracts, kind, name)`, which throws through `miss`.
- `UPDATE: packages/server/src/plugins.ts:921-932` - pass the manifest's contracts to `pluginHost`.
- `UPDATE: packages/sdk/test/plugin-host.test.ts` - the cases below.

## Steps

1. Map each register method to its contract key, which is the plural of its kind.
2. Map `registerVault` and the other ports to the key `ports`, with the port name as the entry.
3. Name a route entry `<method> <path>`, such as `post /:id`.
4. Write `declared`, which does nothing when `contracts` is absent.
5. Make `declared` throw when the key is absent or the name is not in its list.
6. Call `declared` in each register method, after `open()` and before it stores the name.
7. Pass `manifest.contracts` from `loadOne` to `pluginHost`.
8. Leave `on` without a check.
9. Run the SDK plugin tests, and set this task and the plan row to `done`.

## Validation

- `plugin-host.test.ts`: a plugin with `channels: ["x-a"]` registers `x-a`, and fails on `x-b` with a message that names `x-b`.
- `plugin-host.test.ts`: a plugin with `contracts` and no `routes` key fails on its first route.
- `plugin-host.test.ts`: a plugin with no `contracts` registers anything, as today.
- `plugin-host.test.ts`: `ports: ["vault"]` allows `registerVault`.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a registration made after `seal()` is already refused by `open()`, so its message stays the same.
