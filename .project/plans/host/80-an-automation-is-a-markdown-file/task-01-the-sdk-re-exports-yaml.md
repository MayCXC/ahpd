---
title: The sdk re-exports YAML
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/index.ts](../../../../packages/sdk/src/index.ts) - what the sdk exports"
  - "[code://packages/sdk/package.json](../../../../packages/sdk/package.json) - the sdk's dependencies"
---

## Objective

`@ahpd/sdk` exports `parseYaml`, `stringifyYaml` and `YamlError` from `@cofold/yaml`, and a plugin uses them with no direct cofold dependency.

## Files

- `UPDATE: packages/sdk/package.json` - depend on `@cofold/yaml`.
- `UPDATE: packages/sdk/src/index.ts` - re-export the three names.
- `UPDATE: scripts/boundary.mjs` - accept the new dependency, if the script needs a change.
- `UPDATE: docs/PLUGINS.md` - say that a plugin reads YAML through the sdk.

## Steps

1. Add `@cofold/yaml` to the dependencies of `packages/sdk`.
2. Re-export `parseYaml`, `stringifyYaml` and `YamlError` from `packages/sdk/src/index.ts`.
3. Run `pnpm -s boundary`, and make the script accept the dependency if it refuses it.
4. Write one line in `docs/PLUGINS.md` that names the three exports.

## Validation

- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- A test imports `parseYaml` and `stringifyYaml` from the sdk entry and reads back what it wrote.

## Resume
