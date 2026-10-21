---
title: A client lists the plugins
status: todo
depends: [task-01-the-manifest-is-read.md]
layer: "server"
refs:
  - "[code://packages/server/src/plugins.ts#L1197-L1240](../../../../packages/server/src/plugins.ts#L1197-L1240) - `PluginRow` and `describePlugin`"
  - "[code://packages/server/src/commands/plugin.ts#L238-L438](../../../../packages/server/src/commands/plugin.ts#L238-L438) - `configure` and `toggle`, what the methods call"
  - "[code://packages/server/src/install.ts#L467](../../../../packages/server/src/install.ts#L467) - `setPluginEnabled`"
  - "[code://packages/server/src/commands/run.ts#L632-L647](../../../../packages/server/src/commands/run.ts#L632-L647) - `servedRecords('ahpd', ...)`"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L72](../../../../packages/sdk/src/resources/recordschannel.ts#L72) - `recordsChannel`"
---

## Objective

A client subscribes to `x-ahpd-plugins` and gets one row for each configured plugin.
A row has the id, the package, the title, the state, the problem, the manifest and `undeclared` when it has no contracts.
A client calls `x-ahpd/plugins/enable`, `disable` and `options`, and the configuration file changes as `ahpd plugin` changes it.

## Files

- `CREATE: packages/server/src/pluginschannel.ts` - the channel and the three methods.
- `UPDATE: packages/server/src/commands/run.ts:632-647` - add the channel and the methods to `servedRecords`.
- `CREATE: packages/server/test/plugins-channel.test.ts` - the cases below.

## Steps

1. Build each row from `describePlugin`, and add the manifest of the loaded plugin.
2. Mask each option that root configuration masks, with the same code.
3. Serve the rows with `recordsChannel('x-ahpd-plugins', ...)`, keyed by the plugin id.
4. Give read access with the grant `config:read`.
5. Make `enable` and `disable` call `setPluginEnabled`, with the grant that `ahpd plugin enable` needs.
6. Make `options` write one option with the writer that `ahpd plugin set` uses.
7. Answer each method with `restart: true` when the command line answers it.
8. Publish the changed row after each method.
9. Run the server plugin tests, and set this task and the plan row to `done`.

## Validation

- `plugins-channel.test.ts`: two configured plugins give two rows, one with its manifest.
- `plugins-channel.test.ts`: `disable` sets the entry off in the configuration file, and the row says so.
- `plugins-channel.test.ts`: an option written as a `$secret` shows masked in the row.
- `plugins-channel.test.ts`: the host refuses a caller with no grant.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** `oneAtATime` guards the configuration file in `commands/plugin.ts`; the methods use it too.
