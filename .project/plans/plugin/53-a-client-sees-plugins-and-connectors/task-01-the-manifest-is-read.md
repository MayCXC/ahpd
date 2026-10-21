---
title: The manifest is read
status: todo
depends: []
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L1047](../../../../packages/sdk/src/types/plugin.ts#L1047) - `Plugin`, which gets `manifest`"
  - "[code://packages/server/src/plugins.ts#L276-L361](../../../../packages/server/src/plugins.ts#L276-L361) - `Manifest`, `readManifest` and `checkManifest`"
  - "[code://packages/server/src/plugins.ts#L793-L868](../../../../packages/server/src/plugins.ts#L793-L868) - `loadOne`, where the module's fields are read"
---

## Objective

A plugin's manifest has `description`, `categories`, `links` and `contracts`, beside `entry`, `title` and `options`.
An npm plugin writes them in the `ahpd` field of package.json, and a file plugin exports `manifest` from its module.
The loader keeps one manifest for each loaded plugin, from package.json when both exist.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:1047` - add `PluginManifest`, `PluginLink` and `PluginContracts`, and `manifest?` on `Plugin`.
- `UPDATE: packages/sdk/src/types/index.ts` - export the three new types.
- `UPDATE: packages/server/src/plugins.ts:276-361` - read and check the four new fields in `readManifest` and `checkManifest`.
- `UPDATE: packages/server/src/plugins.ts:793-868` - choose the manifest in `loadOne` and keep it on `Loaded`.
- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below.

## Steps

1. Add `PluginLink` with `title` and `url`.
2. Add `PluginContracts` as a record of a kind name to a list of strings.
3. Add `PluginManifest` with `description`, `categories`, `links` and `contracts`, each optional.
4. Add `manifest?: PluginManifest` to `Plugin`.
5. Read `description`, `categories`, `links` and `contracts` from the `ahpd` field in `readManifest`.
6. In `checkManifest`, refuse a field of the wrong type, and name the field and the file.
7. In `loadOne`, use the package.json manifest when it has any of the four fields.
8. Otherwise, use the module's `manifest` export, and check it with the same check.
9. Keep the chosen manifest on `Loaded`, and on `Plugin` for the fold.
10. Run the server plugin tests, and set this task and the plan row to `done`.

## Validation

- `plugin-load.test.ts`: a package with `ahpd.description` and `ahpd.contracts` loads, and `Loaded.manifest` holds both.
- `plugin-load.test.ts`: a file plugin that exports `manifest` loads, and `Loaded.manifest` holds it.
- `plugin-load.test.ts`: a package with both keeps the package.json manifest.
- `plugin-load.test.ts`: the loader refuses an `ahpd.links` that is not a list, and the message names `ahpd.links`.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the server's `Manifest` is the raw package.json read, and keeps its name.
