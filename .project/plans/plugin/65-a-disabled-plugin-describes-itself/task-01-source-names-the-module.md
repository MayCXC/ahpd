---
title: source names the module in a config entry
status: todo
depends: []
layer: "sdk, server, docs"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L604-L626](../../../../packages/sdk/src/types/plugin.ts#L604-L626) - `PluginSpec`"
  - "[code://packages/server/src/config.ts#L767](../../../../packages/server/src/config.ts#L767) - `asSpec`, the one reader of a `plugins` entry"
  - "[code://packages/server/src/plugins.ts#L63](../../../../packages/server/src/plugins.ts#L63) - `nameOf`, which every caller uses for the specifier"
  - "[code://packages/server/src/install.ts#L414-L435](../../../../packages/server/src/install.ts#L414-L435) - `editEntry`, which every entry change goes through"
---

## Objective

The object form of a `plugins` entry names its module with `source`, and `name` is a display name.
An entry with `name` and no `source` still loads, and the daemon writes `source` the next time it changes the entry.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:604-626` - add `source` to the object form, and make `name` the display name.
- `UPDATE: packages/server/src/config.ts:767` - read `source`, and read `name` as the source when `source` is absent.
- `UPDATE: packages/server/src/plugins.ts:63` - rename `nameOf` to `sourceOf`, and return `source`.
- `UPDATE: packages/server/src/install.ts:414-435` - write `source` in place of an old `name`, and keep every other key.
- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below.
- `UPDATE: docs/plugins/PLUGINS.md` - say `source` wherever an entry names its module.
- `UPDATE: docs/server/PLUGINS.md` - the same.

## Steps

1. Add `source: string` to the object form of `PluginSpec`, and document `name` as the display name.
2. Make `asSpec` return `{ source }` for an object with `name` and no `source`.
3. Rename `nameOf` to `sourceOf` and change every caller.
4. Make `editEntry` write the entry with `source`, and drop an old `name` that held the source.
5. Keep a bare string as the source.
6. Run `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`, then restore `packages/sdk/test/fixtures/wire.jsonl`.

## Validation

- A test loads `{ "name": "@acme/foo" }` and `{ "source": "@acme/foo" }`, and both load the same plugin.
- A test disables `{ "name": "@acme/foo", "options": { "a": 1 } }`, and the file then holds `{ "source": "@acme/foo", "options": { "a": 1 }, "enabled": false }`.
- A test loads `{ "source": "@acme/foo", "name": "Foo" }`, and the row's id does not change.
- `git grep -n "nameOf(" -- packages` prints nothing.

## Resume
