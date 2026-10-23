---
title: A plugin change applies at once
status: todo
depends: [task-01-the-host-takes-a-new-fold.md]
layer: "server, docs"
refs:
  - "[code://packages/server/src/plugins.ts#L1156](../../../../packages/server/src/plugins.ts#L1156) - `loadPlugins`, split so one plugin loads or unloads"
  - "[code://packages/server/src/commands/run.ts#L1145](../../../../packages/server/src/commands/run.ts#L1145) - where the daemon keeps what it loaded"
  - "[code://packages/server/src/pluginschannel.ts#L249-L266](../../../../packages/server/src/pluginschannel.ts#L249-L266) - enable and disable"
  - "[code://packages/server/src/pluginschannel.ts#L320-L331](../../../../packages/server/src/pluginschannel.ts#L320-L331) - options"
  - "[code://packages/server/src/rootconfig.ts#L352](../../../../packages/server/src/rootconfig.ts#L352) - a `plugins.` key written through root config"
  - "[code://packages/server/src/commands/plugin.ts#L166-L173](../../../../packages/server/src/commands/plugin.ts#L166-L173) - the restart line of the CLI"
---

## Objective

Enable, disable, options and install load or unload a plugin at once, with no restart.
A plugin with a port or a URI provider still answers `restart: true`.

## Files

- `UPDATE: packages/server/src/plugins.ts:1156` - split `loadPlugins` into `loadOne` for one plugin and `unloadOne`, which runs that plugin's closers.
- `CREATE: packages/server/src/applyplugins.ts` - `applyPlugins`, which compares `config.json` with what is loaded and changes what differs.
- `UPDATE: packages/server/src/commands/run.ts:1145` - keep the base options and the loaded plugins, and pass `applyPlugins` to the channels.
- `UPDATE: packages/server/src/pluginschannel.ts:249-266` - call `applyPlugins` after enable and disable.
- `UPDATE: packages/server/src/pluginschannel.ts:320-331` - call `applyPlugins` after options, and add `x-ahpd/plugins/apply` for the CLI.
- `UPDATE: packages/server/src/rootconfig.ts:352` - call `applyPlugins` after a `plugins.` key is written.
- `UPDATE: packages/server/src/commands/plugin.ts:166-173` - ask a running daemon to apply, in place of the restart line.
- `CREATE: packages/server/test/plugin-live.test.ts` - the cases below.
- `UPDATE: docs/plugins/PLUGINS.md` - say what applies at once, what needs a restart, and that a plugin closes all it opens in a closer.
- `UPDATE: CHANGELOG.md` - one line under the next release.

## Steps

1. Keep each loaded plugin with its name, options, module, contribution and closers.
2. Write `unloadOne(name)`, which runs that plugin's closers and drops its contribution.
3. Write `loadOne(spec)` from the body of `loadPlugins`, and make `loadPlugins` call it for each plugin.
4. Write `applyPlugins`, which reads the plugin list from `config.json`.
5. Make `applyPlugins` unload each plugin that is gone or disabled.
6. Make `applyPlugins` load each plugin that is new or enabled.
7. For new options on a loaded plugin, run its closers and call `apply` again on the same module.
8. Fold the base with every contribution again, and call `host.replace`.
9. Mark a restart and change nothing when a plugin to change has a port or a URI provider.
10. Keep the old fold, and answer the problem, when the fold or `host.replace` refuses the change.
11. Answer `restart: true` from the channel only when `applyPlugins` marked a restart.
12. At the terminal, send `x-ahpd/plugins/apply` to a running daemon.
13. Print the restart line only when the daemon answers `restart: true`.
14. Write the docs section and the changelog line.

## Validation

- `plugin-live.test.ts` enables a plugin with a tool, and an open session gets the tool.
- It disables that plugin, its closer runs, and the tool is gone.
- It changes a plugin's options, and the closer runs before `apply` runs again.
- It disables an adapter plugin, and its connectors show `unavailable`.
- It enables a plugin with a port, and the answer is `restart: true` with nothing loaded.
- `npm test -w packages/server` passes.

## Resume

