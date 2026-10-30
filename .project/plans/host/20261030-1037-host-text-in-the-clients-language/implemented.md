---
title: The host's text comes in the client's language - implemented
date: 2026-10-30
refs:
  - git://8da3c8a4
  - git://9b0d6014
  - git://bb4a1094
  - git://bfdfc1a1
  - git://fd6e2ef0
  - "[code://packages/sdk/src/host/handshake.ts](../../../../packages/sdk/src/host/handshake.ts)"
  - "[code://packages/sdk/src/i18n.ts](../../../../packages/sdk/src/i18n.ts)"
  - "[code://packages/sdk/src/host/formlocale.ts](../../../../packages/sdk/src/host/formlocale.ts)"
  - "[code://packages/sdk/src/resources/recordschannel.ts](../../../../packages/sdk/src/resources/recordschannel.ts)"
  - "[code://packages/server/src/i18n.ts](../../../../packages/server/src/i18n.ts)"
  - "[code://packages/server/src/pluginschannel.ts](../../../../packages/server/src/pluginschannel.ts)"
  - "[code://tools/i18n-check.mjs](../../../../tools/i18n-check.mjs)"
---

The host keeps the `locale` a client sends in `initialize` and `reconnect`.
The new session form and the plugins screen come in that locale.
The host and each first-party plugin ship `pt` and `es` catalogs, and English is the fallback for each string.

## What was built

- [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts) - `initialize` and `reconnect` keep a locale of at most 35 characters on the connection and by client id. `Host.localeOf(clientId)` reads it.
- [`code://packages/sdk/src/i18n.ts`](../../../../packages/sdk/src/i18n.ts) - the `Catalog` type, `HOST_CATALOGS`, `localesOf` and `translated`.
- [`code://packages/server/src/i18n.ts`](../../../../packages/server/src/i18n.ts) - `readCatalogs` reads the folder `ahpd.i18n` names. [`code://packages/server/src/plugins.ts`](../../../../packages/server/src/plugins.ts) checks the field and carries the catalogs on the contribution, on `Loaded` and on `PluginRow`.
- [`code://packages/sdk/src/host/formlocale.ts`](../../../../packages/sdk/src/host/formlocale.ts) - `formIn` translates a form's titles, descriptions, enum labels and item titles. `resolveSessionConfig` calls it before `seeded`.
- [`code://packages/sdk/src/resources/recordschannel.ts`](../../../../packages/sdk/src/resources/recordschannel.ts) - an optional `translate(record, locale)`, called on each send and each snapshot. A diff compares the stored record.
- [`code://packages/server/src/pluginschannel.ts`](../../../../packages/server/src/pluginschannel.ts) - a row's `title`, `manifest.description` and both copies of its options form come in the reader's locale.
- `pt.json` and `es.json` for the host in `packages/sdk/src/i18n/`, and in `i18n/` of each of the eleven first-party plugins.
- [`code://tools/i18n-check.mjs`](../../../../tools/i18n-check.mjs) - `pnpm i18n` lists each catalog path that names no field. CI runs it in the `check` job.
- `docs/plugins/PLUGINS.md`, `docs/server/PLUGINS.md` and `docs/updates/v0_14.md`.

## Verified

- `packages/sdk/test/host-locale.test.ts`: five cases for the locale on `initialize` and `reconnect`.
- `packages/sdk/test/i18n.test.ts`: seven cases for the lookup order.
- `packages/server/test/plugin-i18n.test.ts`: the folder, a bad catalog, a folder outside the package and the first-party catalogs. The lint runs on the shipped catalogs and on a stale catalog.
- `packages/sdk/test/host-sessionconfig-locale.test.ts`: eight cases for the form, with host keys and plugin keys.
- `packages/sdk/test/recordschannel.test.ts` and `packages/server/test/plugins-channel.test.ts`: two readers in two locales get their own row, and each gets one diff.
- `pnpm -s typecheck` passed. The full suite passed: 469 test files and 7773 tests, with 1 file and 29 tests skipped.

## Departures from the plan

- Task 01 - `Host.localeOf` was added, so a test reads the locale through the host.
- Task 01 - an `initialize` with no valid locale clears the stored locale. A `reconnect` with none keeps it.
- Task 02 - the server reads catalogs in a new `packages/server/src/i18n.ts`. A standalone manifest also reads `i18n` when it has a folder.
- Task 03 - the catalogs reach the host through `Contribution.i18n` and `HostOptions.catalogs`.
- Task 03 - `formIn` keeps the enum labels of a key that sets `enumDynamic`. The host's own keys and `scope` use the host catalogs.
- Task 03 - `enumDescriptions` are not translated, because the plan's catalog shape has no field for them.
- Task 04 - `ChannelHandle.localeOf` and `ServedChannel.localeOf` are optional.
- Task 04 - `PluginRow.i18n` holds the catalogs of a plugin that is not loaded. `ahpd plugin list` leaves it out of its output.
- Task 04 - a standalone manifest's `name` is not translated, because step 6 keeps `name` as it is.
- Task 05 - the repository has no `pnpm check`. The lint is `pnpm i18n`, and CI runs it after `pnpm boundary`.
- Task 05 - the lint reads a `session` key from the package sources, and an enum value from the sources or from a dependency's type declarations.
- Task 05 - the catalog section for plugin authors is in `docs/plugins/PLUGINS.md`, beside `icons`. `docs/server/PLUGINS.md` has a short section that links to it.

## Left for later

- [the-pt-catalogs-read-right.md](../../../pending/the-pt-catalogs-read-right.md) - Softov reads each `pt.json`.
- The checks by hand in the plan's final checklist.
