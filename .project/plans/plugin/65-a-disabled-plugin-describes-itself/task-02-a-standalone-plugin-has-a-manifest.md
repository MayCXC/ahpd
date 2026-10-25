---
title: A standalone plugin has a manifest
status: todo
depends: [task-01-source-names-the-module.md]
layer: "sdk, server, docs"
refs:
  - "[code://packages/server/src/plugins.ts#L229-L250](../../../../packages/server/src/plugins.ts#L229-L250) - `resolvePlugin`, which imports a spec with a scheme as written"
  - "[code://packages/server/src/plugins.ts#L130-L140](../../../../packages/server/src/plugins.ts#L130-L140) - `nearestManifest`, which finds the package a file sits in"
  - "[code://packages/server/src/plugins.ts#L319-L361](../../../../packages/server/src/plugins.ts#L319-L361) - `readManifest`, the field checks to reuse"
  - "[code://packages/server/src/plugins.ts#L955-L970](../../../../packages/server/src/plugins.ts#L955-L970) - where a load reads the `manifest` export"
  - "[code://packages/server/src/plugins.ts#L80-L103](../../../../packages/server/src/plugins.ts#L80-L103) - the id read with no import"
  - "[code://packages/sdk/src/types/plugin.ts#L1227-L1290](../../../../packages/sdk/src/types/plugin.ts#L1227-L1290) - `PluginManifest` and the `Plugin` interface"
  - "[code://docs/plugins/PLUGINS.md#L1075-L1135](../../../../docs/plugins/PLUGINS.md#L1075-L1135) - the manifest section"
---

## Objective

A standalone plugin is a file that sits in no package with an `ahpd` field, or a spec with a scheme.
It loads only with a declarative manifest: a `plugin.json` that `source` names, or the manifest keys in its config entry.
A standalone plugin with no manifest fails with a clear error, and the module's `manifest` export goes.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:1227-1290` - add `id`, `name` and `version` to the standalone manifest type, and remove `manifest` from `Plugin`.
- `UPDATE: packages/sdk/src/types/plugin.ts:604-626` - add the manifest keys to the object form of `PluginSpec`.
- `UPDATE: packages/server/src/plugins.ts:229-250` - resolve a `source` that ends in `plugin.json` to the file its `main` names.
- `UPDATE: packages/server/src/plugins.ts:319-361` - read a standalone manifest from `plugin.json` or from the entry, with the checks `readManifest` makes.
- `UPDATE: packages/server/src/plugins.ts:955-970` - refuse a standalone plugin with no manifest, refuse a `manifest` export, and refuse a `name` export that differs from the manifest's `id`.
- `UPDATE: packages/server/src/plugins.ts:80-103` - take a standalone plugin's id from its manifest's `id`.
- `UPDATE: packages/server/test/fixtures/plugin-declared-module.ts` - move its manifest into a `plugin.json` beside it.
- `UPDATE: packages/server/test/fixtures/plugin-declared-both/index.ts` - remove the `manifest` export.
- `CREATE: packages/server/test/fixtures/plugin-standalone/plugin.json` - a standalone manifest whose `main` names `index.mjs`.
- `CREATE: packages/server/test/fixtures/plugin-standalone/index.mjs` - the module it names.
- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below, and the cases that used the `manifest` export.
- `UPDATE: docs/plugins/PLUGINS.md:1075-1135` - the two forms of a standalone manifest, and that a bare file is refused.

## Steps

1. Define the standalone manifest as the `ahpd` field keys plus `id`, `name` and `version`, and `main` in a `plugin.json`.
2. Make `resolvePlugin` read a `plugin.json` source, and resolve its `main` against the file's folder.
3. Read an inline manifest from an entry that has `id`.
4. Treat a spec as standalone when `nearestManifest` finds no package, or when the spec has a scheme.
5. Refuse a standalone plugin with neither manifest, with an error that names `plugin.json` and the inline form.
6. Refuse a module that exports `manifest`, with an error that says where the manifest goes.
7. Refuse a standalone module whose `name` export differs from the manifest's `id`, with both names in the error.
8. Take a standalone plugin's id from the manifest's `id` in `unimportedId`.
9. Run `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`, then restore `packages/sdk/test/fixtures/wire.jsonl`.

## Validation

- A test loads `plugin-standalone/plugin.json`, and the row has the manifest's id, title, version and description.
- A test loads an inline entry `{ "id": "custom", "name": "Custom", "version": "1.0.0", "source": "./custom.mjs" }`.
- A test loads an `https:` spec with an inline manifest through a fake fetch.
- A test loads the same `https:` spec with no manifest, and the daemon refuses it.
- A test loads a bare `.mjs` file with no manifest, and the error names `plugin.json`.
- A test loads a module that exports `manifest`, and the daemon refuses it.
- A test loads a standalone module whose `name` export is not its manifest's `id`, and the error holds both.

## Resume
