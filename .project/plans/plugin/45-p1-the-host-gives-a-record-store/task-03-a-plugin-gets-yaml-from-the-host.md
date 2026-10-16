---
title: A plugin gets YAML from the host
status: done
depends: []
layer: "packages/sdk, packages/server"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L292-L360](../../../../packages/sdk/src/types/plugin.ts#L292-L360) - `PluginContext`"
  - "[code://packages/server/src/plugins.ts#L864-L874](../../../../packages/server/src/plugins.ts#L864-L874) - the context the daemon makes"
---

## Objective

`PluginContext` has `parseYaml(text)` and `stringifyYaml(value)`, and the daemon gives the `@cofold/yaml` functions.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts` - `parseYaml` and `stringifyYaml` on `PluginContext`.
- `UPDATE: packages/server/src/plugins.ts:864-874` - the two functions in the frozen context.
- `UPDATE: packages/sdk/src/plugins.ts` - a loader with no YAML functions gives two that throw.
- `UPDATE: packages/server/test/plugin-load.test.ts` - a plugin parses and writes YAML through its context.

## Steps

1. Declare `parseYaml(text): unknown` and `stringifyYaml(value): string` on `PluginContext`.
2. Pass the `@cofold/yaml` functions into the context at `packages/server/src/plugins.ts:864`.
3. Give two functions that throw `no YAML on this host` where a loader gives none.
4. Write the test.

## Validation

- `plugin-load.test.ts` loads a plugin that parses a frontmatter text and writes it back the same.
- `pnpm exec vitest run packages/server packages/sdk` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** all steps. `plugin-load.test.ts` has the new case, and `plugin-host.test.ts` has a case for the functions that throw.
- **Built as:** `pluginHost` takes a `LoaderContext`, which is a `PluginContext` that can omit the two YAML functions. The sdk exports the type.
- **Built as:** the test contexts that a test gives to `pluginHost` are now typed `LoaderContext`.
- **Built as:** the daemon's `parseYaml` takes the text only, so a plugin cannot change the host's size and depth limits.
