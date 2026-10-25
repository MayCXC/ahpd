---
title: The options schema is in the manifest
status: todo
depends: [task-03-a-disabled-row-carries-its-manifest.md]
layer: "sdk, server, first-party plugins, docs"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L1288](../../../../packages/sdk/src/types/plugin.ts#L1288) - the `optionsSchema` export"
  - "[code://packages/server/src/plugins.ts#L696-L707](../../../../packages/server/src/plugins.ts#L696-L707) - `optionsSchemaOf`, which imports the module"
  - "[code://packages/server/src/plugins.ts#L975-L1040](../../../../packages/server/src/plugins.ts#L975-L1040) - where a load checks options against the export"
  - "[code://packages/server/src/plugins.ts#L1660-L1662](../../../../packages/server/src/plugins.ts#L1660-L1662) - `required`, which reads the `ahpd.options` flags"
  - "[code://packages/server/src/pluginschannel.ts#L150-L165](../../../../packages/server/src/pluginschannel.ts#L150-L165) - `schemaFor`, which answers nothing for a disabled plugin"
  - "[code://packages/agent-cofold/src/plugin.ts#L192](../../../../packages/agent-cofold/src/plugin.ts#L192) - code that reads its own schema"
  - "[code://packages/agent-pi/src/plugin.ts#L108](../../../../packages/agent-pi/src/plugin.ts#L108) - code that reads its own schema"
---

## Objective

A plugin's options schema is a JSON Schema in its manifest: `ahpd.optionsSchema` in package.json, and `optionsSchema` in a standalone manifest.
The daemon reads it with no import, so a disabled plugin has an Options form and its values are checked.
The module's `optionsSchema` export and the `ahpd.options` flags go.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:1288` - remove `optionsSchema` from `Plugin`, and add it to `PluginManifest`.
- `UPDATE: packages/server/src/plugins.ts:319-361` - read `ahpd.optionsSchema`, and refuse `ahpd.options` with an error that names the new key.
- `UPDATE: packages/server/src/plugins.ts:696-707` - answer the schema from the manifest, with no import.
- `UPDATE: packages/server/src/plugins.ts:975-1040` - check options against the manifest schema, and refuse a module that exports `optionsSchema`.
- `UPDATE: packages/server/src/plugins.ts:1660-1662` - take required options from the schema's `required` list.
- `UPDATE: packages/server/src/pluginschannel.ts:150-165` - answer a disabled plugin's schema from its manifest.
- `UPDATE: packages/activepieces/package.json` - move the schema from `src/plugin.ts` to `ahpd.optionsSchema`.
- `UPDATE: packages/agent-acp/package.json` - the same.
- `UPDATE: packages/agent-claude/package.json` - the same.
- `UPDATE: packages/agent-cofold/package.json` - the same.
- `UPDATE: packages/agent-pi/package.json` - the same.
- `UPDATE: packages/bot/package.json` - the same.
- `UPDATE: packages/computer/package.json` - the same.
- `UPDATE: packages/push/package.json` - the same.
- `UPDATE: packages/tasks/package.json` - the same.
- `UPDATE: packages/tunnel-devtunnel/package.json` - the same.
- `UPDATE: packages/webhook/package.json` - the same.
- `UPDATE: packages/agent-cofold/src/plugin.ts:192` - read the schema from its package.json.
- `UPDATE: packages/agent-pi/src/plugin.ts:108` - read the schema from its package.json.
- `UPDATE: packages/server/test/plugins-channel.test.ts` - the cases below.
- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below, and fixtures that export `optionsSchema`.
- `UPDATE: docs/plugins/PLUGINS.md` - the options section and the manifest key table.

## Steps

1. Read `ahpd.optionsSchema` in `readManifest` and `optionsSchema` in a standalone manifest, and check that each is an object.
2. Refuse `ahpd.options` with an error that names `ahpd.optionsSchema`.
3. Refuse a module that exports `optionsSchema` with an error that names the manifest key.
4. Make `optionsSchemaOf` read the manifest, and remove its import.
5. Make the load check options against the manifest schema.
6. Make `required` read the schema's `required` list.
7. Make `schemaFor` answer a disabled plugin's schema from its manifest.
8. Move each first-party schema into its package.json, and remove the export from `src/plugin.ts` and `src/index.ts`.
9. Make agent-cofold and agent-pi import their package.json `with { type: 'json' }` where they read the schema.
10. Run `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`, then restore `packages/sdk/test/fixtures/wire.jsonl`.

## Validation

- A test reads a disabled plugin's schema on the channel, and `x-ahpd/plugins/options` refuses a value the schema refuses.
- A test sets a secret option on a disabled plugin, and the row masks it.
- A test loads a package with `ahpd.options`, and the error names `ahpd.optionsSchema`.
- A test loads a module that exports `optionsSchema`, and the daemon refuses it.
- A test loads each first-party plugin from its package.json, and its schema is the one it exported before.
- `git grep -n "export const optionsSchema" -- packages` prints nothing.

## Resume
