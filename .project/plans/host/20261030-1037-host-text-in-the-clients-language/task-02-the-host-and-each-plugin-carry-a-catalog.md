---
title: The host and each plugin carry a catalog
status: todo
depends: [task-01-the-host-keeps-each-clients-locale.md]
layer: sdk, server
refs:
  - "[code://packages/server/src/plugins.ts#L471-L541](../../../../packages/server/src/plugins.ts#L471-L541) - `ahpd.icons`, read from the package at load"
  - "[code://packages/server/src/plugins.ts#L652-L686](../../../../packages/server/src/plugins.ts#L652-L686) - `checkField` and `checkFields`"
  - npm://@activepieces/piece-resend@0.6.1 - `src/i18n/<lang>.json`, keyed by the English text
---

## Objective

A catalog is one JSON map from the English text to the translation.
The host has its own catalogs, and a plugin names a folder of catalogs in `ahpd.i18n`.
One lookup finds a string's translation for a locale, or answers the English text.

## Files

- `CREATE: packages/sdk/src/i18n.ts` - the `Catalogs` type, `localesOf(locale)` and `translated(text, locale, ...catalogs)`.
- `CREATE: packages/sdk/src/i18n/pt.ts` - the host's Portuguese catalog as one exported map, empty until task 05.
- `CREATE: packages/sdk/src/i18n/es.ts` - the host's Spanish catalog as one exported map, empty until task 05.
- `UPDATE: packages/sdk/src/index.ts` - export the lookup and the type.
- `UPDATE: packages/server/src/plugins.ts:471-541` - read `ahpd.i18n` into `manifest.i18n`, one catalog for each `<locale>.json` in the folder.
- `UPDATE: packages/server/src/plugins.ts:652-686` - `checkField` holds `i18n` to a relative folder path.
- `CREATE: packages/sdk/test/i18n.test.ts` - the lookup cases.
- `CREATE: packages/server/test/plugin-i18n.test.ts` - the `ahpd.i18n` cases, in the shape of `plugin-icons.test.ts`.

## Steps

1. Write `localesOf(locale)`, which answers the tag, then its language subtag, without repeats.
2. Write `translated(text, locale, ...catalogs)`, which tries each locale in each catalog in order.
3. Answer `text` itself when no catalog has a translation, or when `locale` is `undefined`.
4. Import the host's catalogs from `packages/sdk/src/i18n/`, so `tsc` builds them with the rest.
5. In `plugins.ts`, read `ahpd.i18n` as a folder inside the package, and refuse a path that leaves the package.
6. Read each `<locale>.json` in it, and keep only string values.
7. Say one load problem for a file that does not parse.
8. Add `i18n` to `checkFields`, which refuses a value that is not a string and names the field.
9. Write the tests.

## Validation

- `translated('Branch', 'pt-BR', host)` finds a `pt` entry when no `pt-BR` entry exists.
- A string with no entry answers the English text, also for an unknown locale.
- A plugin with `ahpd.i18n: "i18n"` loads `i18n/pt.json` into `manifest.i18n.pt`.
- The host refuses `ahpd.i18n: "../x"`.
- A broken JSON file gives one load problem and no catalog.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
