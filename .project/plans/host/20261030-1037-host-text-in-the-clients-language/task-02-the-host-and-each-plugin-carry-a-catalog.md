---
title: The host and each plugin carry a catalog
status: done
depends: [task-01-the-host-keeps-each-clients-locale.md]
layer: sdk, server
refs:
  - "[code://packages/server/src/plugins.ts#L471-L541](../../../../packages/server/src/plugins.ts#L471-L541) - `ahpd.icons`, read from the package at load"
  - "[code://packages/server/src/plugins.ts#L652-L686](../../../../packages/server/src/plugins.ts#L652-L686) - `checkField` and `checkFields`"
  - npm://@activepieces/piece-resend@0.6.1 - `src/i18n/<lang>.json`, one file for each language
  - "[code://packages/agent-cofold/src/plugin.ts#L29](../../../../packages/agent-cofold/src/plugin.ts#L29) - a JSON import with `{ type: 'json' }`, the pattern for the host's catalogs"
---

## Objective

A catalog is one JSON object, keyed by the field path of each text.
The host has its own catalogs, and a plugin names a folder of catalogs in `ahpd.i18n`.
One lookup finds the translation at a path for a locale, or answers the English text.

### Catalog shape

A plugin's `i18n/pt.json`:

```json
{
  "meta": {
    "title": "ACP servidor",
    "description": "Execute agentes por meio de JSON-RPC em entradas e saídas padrão para automação."
  },
  "options": {
    "command": { "title": "Comando", "description": "O programa que inicia o servidor ACP." }
  },
  "session": {
    "permissionMode": {
      "title": "Aprovações",
      "description": "Como o agente trata as aprovações de ferramentas.",
      "enum": { "default": "Padrão", "yolo": "YOLO" }
    }
  }
}
```

- `meta` holds the plugin's title and its manifest description.
- `options.<key>` holds the text of one key in the plugin's options form.
- `session.<key>` holds the text of one key in the new session form.
- `enum.<value>` holds the label of one enum value, keyed by the value.
- `items.title` holds the title of an array property's items.
- The host's catalogs have the same shape, with only a `session` block for the host's own keys.
- A path with no entry shows the English text.

## Files

- `CREATE: packages/sdk/src/i18n.ts` - the `Catalogs` type, `localesOf(locale)` and `translated(path, english, locale, ...catalogs)`.
- `CREATE: packages/sdk/src/i18n/pt.json` - the host's Portuguese catalog, empty until task 05.
- `CREATE: packages/sdk/src/i18n/es.json` - the host's Spanish catalog, empty until task 05.
- `UPDATE: packages/sdk/src/index.ts` - export the lookup and the type.
- `UPDATE: packages/server/src/plugins.ts:471-541` - read `ahpd.i18n` into `manifest.i18n`, one catalog for each `<locale>.json` in the folder.
- `UPDATE: packages/server/src/plugins.ts:652-686` - `checkField` holds `i18n` to a relative folder path.
- `CREATE: packages/sdk/test/i18n.test.ts` - the lookup cases.
- `CREATE: packages/server/test/plugin-i18n.test.ts` - the `ahpd.i18n` cases, in the shape of `plugin-icons.test.ts`.

## Steps

1. Write `localesOf(locale)`, which answers the tag, then its language subtag, without repeats.
2. Write `translated(path, english, locale, ...catalogs)`, where `path` is an array of keys, such as `['session', 'isolation', 'title']`.
3. Try each locale in each catalog in order, and answer the first string at `path`.
4. Answer `english` when no catalog has a string at `path`, or when `locale` is `undefined`.
5. Import the host's catalogs with `{ type: 'json' }`, as `agent-cofold` imports its `package.json`.
6. In `plugins.ts`, read `ahpd.i18n` as a folder inside the package, and refuse a path that leaves the package.
7. Read each `<locale>.json` in it, and drop each value that is not an object or a string.
8. Say one load problem for a file that does not parse.
9. Add `i18n` to `checkFields`, which refuses a value that is not a string and names the field.
10. Write the tests.

## Validation

- `translated(['session', 'branch', 'title'], 'Branch', 'pt-BR', host)` finds the `pt` entry when no `pt-BR` entry exists.
- A path with no entry answers the English text, also for an unknown locale.
- A path that ends at an object, not a string, answers the English text.
- A plugin with `ahpd.i18n: "i18n"` loads `i18n/pt.json` into `manifest.i18n.pt`.
- The host refuses `ahpd.i18n: "../x"`.
- A broken JSON file gives one load problem and no catalog.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
