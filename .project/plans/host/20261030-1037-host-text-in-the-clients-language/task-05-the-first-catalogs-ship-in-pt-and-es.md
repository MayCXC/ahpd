---
title: The first catalogs ship in pt and es
status: done
depends: [task-03-the-new-session-form-comes-in-the-locale.md, task-04-the-plugins-screen-comes-in-the-locale.md]
layer: sdk, plugins, docs
refs:
  - "[code://packages/sdk/src/host/sessionconfig.ts#L60-L240](../../../../packages/sdk/src/host/sessionconfig.ts#L60-L240) - the host's form keys to translate"
  - "[code://packages/agent-claude/package.json#L71-L77](../../../../packages/agent-claude/package.json#L71-L77) - the `ahpd` field, where `i18n` goes"
---

## Objective

The host and each first-party plugin ship `pt` and `es` catalogs for the form and the plugins screen.
A lint lists each catalog path that matches no field.

## Files

- `UPDATE: packages/sdk/src/i18n/pt.json` - the host's form text in Portuguese.
- `UPDATE: packages/sdk/src/i18n/es.json` - the host's form text in Spanish.
- `CREATE: packages/<plugin>/i18n/pt.json` - for each first-party plugin, its title, description, form keys and options form in Portuguese.
- `CREATE: packages/<plugin>/i18n/es.json` - the same in Spanish.
- `UPDATE: packages/<plugin>/package.json` - `"i18n": "i18n"` in the `ahpd` field, and `i18n` in `files`.
- `CREATE: tools/i18n-check.mjs` - lists each catalog path that matches no field: an unknown `options` or `session` key, an unknown enum value, or an unknown block.
- `UPDATE: docs/server/PLUGINS.md` - the `ahpd.i18n` field, the catalog shape and the lookup order.
- `UPDATE: docs/updates/v0_14.md` - a line for the client's language.
- `CREATE: .project/pending/the-pt-catalogs-read-right.md` - Softov reads each `pt.json` and says which entries to change.

## Steps

1. Collect the English text of the host's form keys and of each first-party plugin's manifest, schema and options form.
2. Write the `pt` and `es` catalogs for the host and for each first-party plugin.
3. Add `"i18n": "i18n"` to each plugin's `ahpd` field and the folder to its `files`.
4. Write `tools/i18n-check.mjs`, and add it to `pnpm check`.
5. Write the `ahpd.i18n` section in `docs/server/PLUGINS.md`.
6. Add a line under 0.14 in `docs/updates/v0_14.md`.
7. Write the pending check file with one section for each catalog.

## Validation

- `node tools/i18n-check.mjs` prints nothing on the shipped catalogs.
- The script prints a path whose key or enum value no form holds, and exits 1.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
