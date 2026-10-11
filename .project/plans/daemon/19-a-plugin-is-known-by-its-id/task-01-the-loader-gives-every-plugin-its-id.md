---
title: The loader gives every plugin its id, enabled or not
status: todo
depends: []
layer: "server"
refs:
  - "[code://packages/server/src/plugins.ts#L60](../../../../packages/server/src/plugins.ts#L60) - `nameOf`, the spec as written"
  - "[code://packages/server/src/plugins.ts#L89-L101](../../../../packages/server/src/plugins.ts#L89-L101) - `nearestManifest` and `fileNameOf`, the fallbacks"
  - "[code://packages/server/src/plugins.ts#L655-L800](../../../../packages/server/src/plugins.ts#L655-L800) - `loadOne`: the name at L663 and L682"
  - "[code://packages/server/src/plugins.ts#L846-L852](../../../../packages/server/src/plugins.ts#L846-L852) - the options schemas, keyed by spec"
  - "[code://packages/server/src/plugins.ts#L956-L1004](../../../../packages/server/src/plugins.ts#L956-L1004) - the check for a repeated spec, and where the schemas are filled"
---

## Objective

The loader imports every entry, enabled or disabled, and gives it an id before it applies any plugin.
`pluginIdOf(spec)` returns that id for the run.
Two entries with the same id stop the start, and the message names both specs.

## Files

- `UPDATE: packages/server/src/plugins.ts:60-101` - add `pluginIdOf(spec)` and the map from spec to id that it reads.
- `UPDATE: packages/server/src/plugins.ts:655-800` - split `loadOne` into an import that names the plugin and an `apply`.
- `UPDATE: packages/server/src/plugins.ts:846-852` - key the schemas by id.
- `UPDATE: packages/server/src/plugins.ts:956-1004` - import and name every entry first, then check ids, then apply the enabled ones.
- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below.

## Steps

1. Move the import and the naming in `loadOne` into a function that returns the module and its id.
2. Keep the order of the name: the module's `name` export, the manifest's `name`, the file name, the spec.
3. Import a disabled entry with the same function, and never call its `apply`.
4. When the import of a disabled entry fails, use the manifest's `name`, then the file name, then the spec.
5. Log a failed import of a disabled entry at debug level, and continue.
6. Record each id in a map from spec to id, held for the run.
7. Add `pluginIdOf(spec)`, which reads the map.
8. For a spec the map does not hold, make `pluginIdOf` use the manifest's `name`, the file name or the spec.
9. Add `pluginIdsOf(specs)`, which imports and names the specs for a command that runs without a daemon.
10. Replace the check for a repeated spec with a check for a repeated id.
11. Make the refusal say "<spec> and <spec> are the same plugin, <id>."
12. Key the options schemas and `optionsSchemaLoaded` by id.

## Validation

- A test: `./packages/bot/src/index.ts`, disabled, has the id `ahpd-bot`, and its `apply` is not called.
- A test: a disabled entry whose import fails has the manifest's `name` as its id.
- A test: a path and the npm package of one plugin stop the start, and the message names both specs.
- A test: `pluginIdOf` gives the manifest's `name` for a spec the run did not load.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- `pnpm exec vitest run packages/server/test/plugin-load.test.ts packages/server/test/plugin-config.test.ts` passes.
