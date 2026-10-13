---
title: Root config keys each plugin by its id
status: done
depends: [task-01-the-loader-gives-every-plugin-its-id.md]
layer: "server"
refs:
  - "[code://packages/server/src/commands/config.ts#L104-L133](../../../../packages/server/src/commands/config.ts#L104-L133) - `keyed`, the one key builder, and `schemasFor`"
  - "[code://packages/server/src/rootconfig.ts#L244-L398](../../../../packages/server/src/rootconfig.ts#L244-L398) - `entries`, `pluginKey`, `schema`, `values` and `write`"
---

## Objective

Root config shows each plugin as `plugins.<id>`, and a write to that key changes that entry in `config.json`.
A write finds its entry in the unfiltered `plugins` list.

## Files

- `UPDATE: packages/server/src/commands/config.ts:104-133` - build each key and each schema from `pluginIdOf`.
- `UPDATE: packages/server/src/rootconfig.ts:244-398` - find the entry by id, and write at its index in the unfiltered list.
- `UPDATE: packages/server/test/server-root-config.test.ts` - change the keys to ids, and add the cases below.
- `UPDATE: packages/server/test/server-commands.test.ts:207-340` - change the keys to ids.

## Steps

1. Make `keyed` build `plugins.${pluginIdOf(spec)}`.
2. Make `schemasFor` read the schema by id.
3. In `rootconfig.ts`, find the entry whose id matches the key.
4. Write at that entry's index in `held.plugins`, not at its index in the filtered list.
5. Read the schema with `optionsSchemaLoaded(pluginIdOf(spec))`.

## Validation

- A test: `./packages/agent-claude/src/index.ts` shows as `plugins.@ahpd/agent-claude`.
- A test: with an invalid entry first, a write to the next entry's key changes that entry.
- `pnpm -s typecheck` passes.
- `pnpm exec vitest run packages/server/test/server-root-config.test.ts packages/server/test/server-commands.test.ts` passes.
