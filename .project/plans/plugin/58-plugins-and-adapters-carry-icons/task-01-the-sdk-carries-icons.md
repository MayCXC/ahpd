---
title: The sdk carries icons
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L1204](../../../../packages/sdk/src/types/plugin.ts#L1204) - `PluginManifest` gets `icons`"
  - "[code://packages/sdk/src/types/connectors.ts#L103](../../../../packages/sdk/src/types/connectors.ts#L103) - `Adapter` gets `icons`"
  - "[code://packages/sdk/src/plugins/validate.ts#L580](../../../../packages/sdk/src/plugins/validate.ts#L580) - `checkAdapter` checks the icon shape"
  - "[code://packages/sdk/src/connectors/adapters.ts#L51-L58](../../../../packages/sdk/src/connectors/adapters.ts#L51-L58) - `rowOf` sends the icons"
---

## Objective

`PluginManifest` and `Adapter` have `icons?: Icon[]`, with the `Icon` type of AHP.
`checkAdapter` refuses an icon of the wrong shape, and the adapters channel row sends the icons.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:1204` - add `icons?: Icon[]` to `PluginManifest`, with a comment that a path is relative to the package.
- `UPDATE: packages/sdk/src/types/connectors.ts:103` - add `icons?: Icon[]` to `Adapter`.
- `UPDATE: packages/sdk/src/plugins/validate.ts:580` - check `icons` in `checkAdapter`.
- `UPDATE: packages/sdk/src/connectors/adapters.ts:51-58` - add `icons` to `rowOf` when the adapter has them.
- `UPDATE: packages/sdk/test/` - cases for the shape check and the row.

## Steps

1. Import the type `Icon` from `@microsoft/agent-host-protocol` in both type files.
2. Add `icons?: Icon[]` to `PluginManifest` and to `Adapter`.
3. Write `checkIcons(value, by)`, which accepts an array of objects with a string `src`.
4. Make `checkIcons` accept an optional string `contentType`, a string array `sizes`, and a `theme` of `light` or `dark`.
5. Call `checkIcons` from `checkAdapter`, and export it so the server checks a manifest with it.
6. Add `icons` to `rowOf` only when the adapter has at least one icon.
7. Add tests for a good icon, a missing `src`, a wrong `theme`, and a row with icons and without them.

## Validation

- `npm test -w packages/sdk` passes, with the new cases.
- `npm run typecheck` passes.

## Resume

