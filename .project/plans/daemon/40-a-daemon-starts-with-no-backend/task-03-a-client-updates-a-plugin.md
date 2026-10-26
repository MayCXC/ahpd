---
title: A client updates a plugin
status: implemented
depends: []
layer: server
refs:
  - "[code://packages/server/src/pluginschannel.ts#L377-L425](../../../../packages/server/src/pluginschannel.ts#L377-L425) - `x-ahpd/plugins/install`, the pattern to mirror"
  - "[code://packages/server/src/pluginschannel.ts#L716-L727](../../../../packages/server/src/pluginschannel.ts#L716-L727) - the method map"
  - "[code://packages/server/src/install.ts#L809](../../../../packages/server/src/install.ts#L809) - `updatePlugins`"
  - "[code://packages/server/src/commands/plugin.ts#L285-L320](../../../../packages/server/src/commands/plugin.ts#L285-L320) - `ahpd plugin update`, the CLI it matches"
---

## Objective

`x-ahpd/plugins/update {id}` moves one installed plugin to the newest version that this daemon loads, as `ahpd plugin update <name>` does, and reloads it. It needs `plugin:install`.

## Files

- `UPDATE: packages/server/src/pluginschannel.ts:377-425` - add `updateMethod` beside `installMethod`, with the same grant, staging and one-at-a-time lock.
- `UPDATE: packages/server/src/pluginschannel.ts:716-727` - add `${DOMAIN}/update` to the method map.
- `UPDATE: packages/server/test/plugins-channel.test.ts` - the method's cases, with the file's fake npm and a fake registry.
- `UPDATE: docs/plugins/PLUGINS.md` - the method, beside install and remove.

## Steps

1. Add `updateMethod` with grant `plugin:install` and a `describe` in the form of `installMethod`.
2. Refuse an `id` that is not a configured plugin, and a plugin not installed from the registry, with `-32602`.
3. Run `updatePlugins([name], ...)` with the daemon's version, the shared runner and the shared fetch.
4. Answer `{ id, from, to }`, or `{ id }` with no `from` when nothing moved.
5. Reload the plugin when its version moved, as `reload` does.
6. Run the method under the same one-at-a-time lock as install and remove.
7. Add tests: a move, no move, an unknown id, a path plugin, a caller without the grant.
8. Run the gates, and set this task and the plan row to `implemented`.

## Validation

- The update cases in `packages/server/test/plugins-channel.test.ts` pass.
- The gates pass.

## Resume
