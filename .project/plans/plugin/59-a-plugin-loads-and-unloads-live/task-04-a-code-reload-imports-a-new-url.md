---
title: A code reload imports a new URL
status: todo
depends: [task-02-a-plugin-change-applies-at-once.md]
layer: "server, docs"
refs:
  - "[code://packages/server/src/plugins.ts#L1156](../../../../packages/server/src/plugins.ts#L1156) - the loader that calls `import()`"
  - "[code://packages/server/src/pluginschannel.ts#L249-L266](../../../../packages/server/src/pluginschannel.ts#L249-L266) - the pattern for a new channel command"
  - "[code://packages/server/src/commands/plugin.ts](../../../../packages/server/src/commands/plugin.ts) - `ahpd plugin`, which gets `reload`"
---

## Objective

A reload with new code imports the plugin from a new URL, so the new files load with no restart.
Each reload keeps the old module in memory until a restart, and the docs say so.

## Files

- `UPDATE: packages/server/src/plugins.ts` - add a reload count to each plugin, and import `<url>?v=<count>`.
- `UPDATE: packages/server/src/pluginschannel.ts` - add `x-ahpd/plugins/reload`, which takes `{ id }`.
- `UPDATE: packages/server/src/commands/plugin.ts` - add `ahpd plugin reload <name>`, and reload after `ahpd plugin update`.
- `UPDATE: package.json` - raise `engines.node` to `>=22.18`.
- `UPDATE: packages/server/test/plugin-live.test.ts` - the reload case.
- `UPDATE: docs/plugins/PLUGINS.md` - the reload command and the memory it keeps.
- `UPDATE: CHANGELOG.md` - the reload command and the new Node version.

## Steps

1. Count the reloads of each plugin, from 0 at start.
2. Import `<url>?v=<count>` when the count is above 0.
3. Write the reload as `unloadOne`, then a count increase, then `loadOne`.
4. Add `x-ahpd/plugins/reload`, which answers `restart: true` for a plugin with a port, as task 02 does.
5. Add `ahpd plugin reload <name>`, which sends the request to the running daemon.
6. Make `ahpd plugin update` reload each plugin that it updated.
7. Raise `engines.node` to `>=22.18` in the root `package.json`.
8. Write the docs and the changelog lines.

## Validation

- `plugin-live.test.ts` loads a plugin file, rewrites the file, reloads, and the new code answers.
- `npm test -w packages/server` passes.
- `npm run typecheck` passes.

## Resume

