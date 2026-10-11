---
title: `--plugin-option` names the id
status: todo
depends: [task-01-the-loader-gives-every-plugin-its-id.md]
layer: "server"
refs:
  - "[code://packages/server/src/commands/options.ts#L313-L343](../../../../packages/server/src/commands/options.ts#L313-L343) - `pluginOptionIn` and `splitPluginOption`"
  - "[code://packages/server/src/commands/options.ts#L885-L926](../../../../packages/server/src/commands/options.ts#L885-L926) - the match against the specs, before any import"
  - "[code://packages/server/src/commands/plugin.ts#L36-L59](../../../../packages/server/src/commands/plugin.ts#L36-L59) - `recordedOverride`"
---

## Objective

`--plugin-option <id>.<key>=<value>` sets an option on the plugin with that id.
The spec as written still works.
The loader sets the options after it names every plugin and before it applies any plugin.

## Files

- `UPDATE: packages/server/src/commands/options.ts:885-926` - check the form of each flag, and keep the list for the loader.
- `UPDATE: packages/server/src/plugins.ts` - set each option on its entry, after the naming and before the first `apply`.
- `UPDATE: packages/server/src/commands/plugin.ts:36-59` - match a recorded flag by id and by spec.
- `UPDATE: packages/server/test/server-commands.test.ts:862` - the cases below.

## Steps

1. In `optionsFrom`, keep the check of the form `<plugin>.<key>=<value>`.
2. Remove the match against the specs from `optionsFrom`, and pass the flags on in `Options`.
3. In the loader, after the naming, match each flag with `pluginOptionIn` over the ids and the specs.
4. Prefer an id over a spec when both match.
5. Refuse a flag that names no enabled plugin, with the message `optionsFrom` gives today.
6. Set the value deep into that entry's options, as `optionsFrom` does today.
7. Make `recordedOverride` match a recorded flag by the plugin's id and by its spec.

## Validation

- A test: `--plugin-option @ahpd/agent-claude.x=1` sets `x` on the entry `./packages/agent-claude/src/index.ts`.
- A test: `--plugin-option ./packages/agent-claude/src/index.ts.x=1` still sets `x`.
- A test: `--plugin-option nothing.x=1` stops the start, and the message names `nothing`, not the value.
- `pnpm -s typecheck` passes.
- `pnpm exec vitest run packages/server/test/server-commands.test.ts packages/server/test/plugin-config.test.ts` passes.
