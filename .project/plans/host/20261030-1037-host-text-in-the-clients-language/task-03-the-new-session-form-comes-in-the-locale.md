---
title: The new session form comes in the locale
status: todo
depends: [task-02-the-host-and-each-plugin-carry-a-catalog.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1527-L1605](../../../../packages/sdk/src/host/sessionmethods.ts#L1527-L1605) - `resolveSessionConfig`"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L60-L240](../../../../packages/sdk/src/host/sessionconfig.ts#L60-L240) - the host's own form keys"
---

## Objective

`resolveSessionConfig` answers each property's `title`, `description` and `enumLabels` in the caller's locale.
A key is looked up in the catalog of the plugin that declared it, then in the host's catalog.

## Files

- `CREATE: packages/sdk/src/host/formlocale.ts` - `formIn(properties, locale, catalogsOf)`, which translates a form's text fields.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1527-1605` - call `formIn` on the properties before `seeded`, with `localeOf(clientId)`.
- `UPDATE: packages/sdk/src/host/context.ts` - `catalogsOf(key, provider)`, the catalogs of the plugin that declared the key or the backend.
- `CREATE: packages/sdk/test/host-sessionconfig-locale.test.ts` - the cases below.

## Steps

1. Write `formIn`, which copies each property and translates `title`, `description` and each `enumLabels` entry.
2. Translate `items.title` of an array property the same way.
3. Leave `enum`, `default`, `const` and every other field as they are.
4. For a key a plugin contributed, use that plugin's catalogs, then the host's.
5. For a backend's own key, use the catalogs of the plugin that registered the backend, then the host's.
6. For a host key, use the host's catalogs.
7. Call `formIn` before `seeded` in `resolveSessionConfig`, so an answerer's labels stay as the answerer gave them.
8. Write the tests.

## Validation

- A caller with `pt` gets the host's `Isolation` title from the `pt` catalog.
- A caller with no locale gets the English form, the same as before this task.
- A backend key with a translation in its plugin's catalog comes translated, and one without comes in English.
- A branch name from an answerer is never translated, also when it equals a catalog key.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
