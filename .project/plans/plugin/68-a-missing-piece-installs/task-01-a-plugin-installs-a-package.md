---
title: A plugin installs a package into its folder
status: todo
depends: []
layer: "sdk, server, docs"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L761-L773](../../../../packages/sdk/src/types/plugin.ts#L761-L773) - `PluginHost`, beside `problem`"
  - "[code://packages/server/src/plugins.ts#L1165](../../../../packages/server/src/plugins.ts#L1165) - `base`, the plugin's own folder"
  - "[code://packages/server/src/pluginschannel.ts#L540-L548](../../../../packages/server/src/pluginschannel.ts#L540-L548) - the npm run of plan 64"
---

## Objective

A plugin calls `host.install(spec)`, and the package is installed into `installed/` inside the plugin's folder, where the plugin can import it from `host.installed`.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts` - `install(spec)` and `installed` on `PluginHost`, and the answer type.
- `UPDATE: packages/sdk/src/plugins/plugins.ts` - the host option that runs an install.
- `UPDATE: packages/server/src/plugins.ts` - `loadOne` gives the plugin `installed` under `base`, and runs npm there.
- `CREATE: packages/server/test/plugin-install.test.ts` - the install call with a fake npm.
- `UPDATE: docs/plugins/PLUGINS.md` - `install` and `installed` in the `PluginHost` table.

## Steps

1. Add `installed`, the absolute path of `installed/` in the plugin's folder, to `PluginHost`.
2. Add `install(spec)` to `PluginHost`, answering `{ version }` or `{ error }`.
3. Create `installed/package.json` on the first install when it does not exist.
4. Run `npm install --prefix <installed> --ignore-scripts --no-audit --no-fund <spec>` through the same runner that plan 64 uses.
5. Read the version npm installed from `installed/node_modules/<name>/package.json`.
6. Answer `{ error }` with the last npm error line when npm fails.
7. Run one install at a time for a plugin, and queue the next one.
8. Answer `{ error }` for a plugin that has no folder of its own.
9. Document `install` and `installed` in `PLUGINS.md`.

## Validation

- `plugin-install.test.ts`: with a fake npm, an install answers the version and writes into `installed/` only.
- The same file: a failed npm answers its error, and two calls at once run one after the other.
- The fake npm sees `--ignore-scripts`.
- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.

## Resume
