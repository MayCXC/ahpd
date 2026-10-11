---
title: The plugin verbs and the listing take the id
status: todo
depends: [task-01-the-loader-gives-every-plugin-its-id.md]
layer: "server"
refs:
  - "[code://packages/server/src/install.ts#L262-L394](../../../../packages/server/src/install.ts#L262-L394) - the lookups by name"
  - "[code://packages/server/src/commands/configure.ts#L86-L118](../../../../packages/server/src/commands/configure.ts#L86-L118) - `named` and `switched`"
  - "[code://packages/server/src/commands/plugin.ts#L62-L431](../../../../packages/server/src/commands/plugin.ts#L62-L431) - `list`, `configure` and the toggle"
  - "[code://packages/server/src/plugins.ts#L1048-L1157](../../../../packages/server/src/plugins.ts#L1048-L1157) - `PluginRow`, `describePlugin` and `pluginLine`"
---

## Objective

`ahpd plugin config|enable|disable` find a plugin by its id, then by its spec as written.
The listing shows the id as `name`, and the spec as `spec`.

## Files

- `UPDATE: packages/server/src/install.ts:262-394` - match an entry by id, then by spec.
- `UPDATE: packages/server/src/commands/configure.ts:86-118` - the same match in `named` and `switched`.
- `UPDATE: packages/server/src/commands/plugin.ts:62-431` - name the ids with `pluginIdsOf`, and label each plugin by id.
- `UPDATE: packages/server/src/plugins.ts:1048-1157` - add `spec` to `PluginRow`, set `name` to the id, and give a disabled entry its id.
- `UPDATE: packages/server/test/plugin-list.test.ts` - the rows carry the id.
- `UPDATE: packages/server/test/plugin-config.test.ts` - the cases below.

## Steps

1. Add one function in `install.ts` that finds an entry by id, then by spec.
2. Use it in `namedIn`, `pluginEntry`, `editEntry`, `setPluginOption` and `setPluginEnabled`.
3. Use it in `named` and `switched` in `configure.ts`.
4. In `plugin.ts`, call `pluginIdsOf` once per command, before the first lookup.
5. Add `spec` to `PluginRow`, and keep the mask on its userinfo.
6. Set `PluginRow.name` to the id, for a disabled entry too.
7. Make `pluginLine` print the id, and the spec when it differs.

## Validation

- A test: `plugin config ahpd-bot` and `plugin config ./packages/bot/src/index.ts` find the same entry.
- A test: `plugin disable @ahpd/agent-claude` disables the path entry.
- A test: a listed git spec with a credential still shows it masked.
- `pnpm -s typecheck` passes.
- `pnpm exec vitest run packages/server/test/plugin-list.test.ts packages/server/test/plugin-config.test.ts` passes.
