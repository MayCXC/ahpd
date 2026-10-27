---
title: A piece with a large logo has a shipped SVG
status: dropped
depends: [task-03-a-piece-has-its-logo.md]
layer: "activepieces"
refs:
  - "[code://packages/activepieces/src/logos.ts#L96-L156](../../../../packages/activepieces/src/logos.ts#L96-L156) - `logoOf`, which reads the cache and then the CDN"
  - "[code://packages/activepieces/src/plugin.ts#L216-L219](../../../../packages/activepieces/src/plugin.ts#L216-L219) - where each piece's logo is asked for"
  - "[code://packages/activepieces/package.json#L41-L47](../../../../packages/activepieces/package.json#L41-L47) - `files`, which must ship the new folder"
  - https://simpleicons.org - the marks, under CC0 1.0
---

## Objective

A piece whose CDN logo is over 32 KB still shows an icon.
The package ships an SVG for that piece, and `logoOf` uses it before the cache and the CDN.

Dropped: plan 69 task 03 replaces this task. It carries the four marks in the host's `icons` folder, and `logoOf` answers a `mark:` source for these pieces.

## Files

- `CREATE: packages/activepieces/icons/ap-jira-cloud.svg` - the Jira mark from Simple Icons, in its brand colour.
- `CREATE: packages/activepieces/icons/ap-linear.svg` - the Linear mark from Simple Icons, in its brand colour.
- `CREATE: packages/activepieces/icons/ap-resend.svg` - the Resend mark from Simple Icons, in its brand colour.
- `CREATE: packages/activepieces/icons/ap-whatsapp.svg` - the WhatsApp mark from Simple Icons, in its brand colour.
- `UPDATE: packages/activepieces/src/logos.ts:96-156` - read `icons/<piece>.svg` in the package first.
- `UPDATE: packages/activepieces/package.json:41-47` - add `icons` to `files`.
- `UPDATE: packages/activepieces/test/logos.test.ts` - cases for a shipped file, and a shipped file over 32 KB.
- `UPDATE: docs/plugins/activepieces.md` - say that a shipped SVG wins over the piece's own logo.
- `UPDATE: .project/pending/plugin-58-icon-curation.md` - add one row for each of the four marks.

## Steps

1. Download each mark from `https://cdn.simpleicons.org/<slug>`, with the slugs `jira`, `linear`, `resend` and `whatsapp`.
2. Save each one under `packages/activepieces/icons/`, named after the adapter.
3. Add an XML comment to each file that names Simple Icons and CC0 1.0.
4. Check that no file holds a script, an event attribute or an external reference.
5. Make `logoOf` read `<package>/icons/<piece>.svg` before the cache, and answer it as `image/svg+xml`.
6. Apply the 32 KB limit to a shipped file, and fall through to the cache when it is larger.
7. Resolve the package folder from `import.meta.url`, so the path does not depend on the daemon's working folder.
8. Add `icons` to `files` in `package.json`.
9. Add a test for a shipped file that wins over a cached one and makes no fetch.
10. Add a test for a shipped file over 32 KB, which falls through to the cache.
11. Add a section to `docs/plugins/activepieces.md` that says a shipped SVG wins.
12. Add the four rows to the curation table in `.project/pending/plugin-58-icon-curation.md`.

## Validation

- `npx vitest run packages/activepieces` passes, with the two new cases.
- `npm pack --dry-run -w packages/activepieces` lists the four files under `icons/`.
- With the config-dev pieces, the adapters channel rows for Jira, Linear, Resend and WhatsApp have icons.

## Resume
