---
title: The new session form comes in the locale
status: done
depends: [task-02-the-host-and-each-plugin-carry-a-catalog.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1527-L1605](../../../../packages/sdk/src/host/sessionmethods.ts#L1527-L1605) - `resolveSessionConfig`"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L60-L240](../../../../packages/sdk/src/host/sessionconfig.ts#L60-L240) - the host's own form keys"
---

## Objective

`resolveSessionConfig` answers each property's `title`, `description` and `enumLabels` in the caller's locale.
The text of key `<key>` is at `session.<key>` in a catalog, and an options form uses `options.<key>`.
A key is looked up in the catalog of the plugin that declared it, then in the host's catalog.

## Files

- `CREATE: packages/sdk/src/host/formlocale.ts` - `formIn(properties, block, locale, catalogsOf)`, which translates a form's text fields from `block`, `session` or `options`.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1527-1605` - call `formIn` on the properties before `seeded`, with `localeOf(clientId)`.
- `UPDATE: packages/sdk/src/host/context.ts` - `catalogsOf(key, provider)`, the catalogs of the plugin that declared the key or the backend.
- `CREATE: packages/sdk/test/host-sessionconfig-locale.test.ts` - the cases below.

## Steps

1. Write `formIn`, which copies each property and translates `title` and `description` from `<block>.<key>.title` and `.description`.
2. Translate the `enumLabels` entry of each value from `<block>.<key>.enum.<value>`.
3. Translate `items.title` of an array property from `<block>.<key>.items.title`.
4. Leave `enum`, `default`, `const` and every other field as they are.
5. For a key a plugin contributed, use that plugin's catalogs, then the host's.
6. For a backend's own key, use the catalogs of the plugin that registered the backend, then the host's.
7. For a host key, use the host's catalogs.
8. Call `formIn` with `session` before `seeded` in `resolveSessionConfig`, so an answerer's labels stay as the answerer gave them.
9. Write the tests.

## Validation

- A caller with `pt` gets the host's `Isolation` title from `session.isolation.title` in the `pt` catalog.
- An enum value with no entry at `enum.<value>` keeps its English label.
- A caller with no locale gets the English form, the same as before this task.
- A backend key with a translation in its plugin's catalog comes translated, and one without comes in English.
- A branch name from an answerer is never translated, also when it equals a catalog key.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
