---
title: An Activepieces piece has its logo
status: todo
depends: [task-02-the-host-sends-a-package-icon.md]
layer: "activepieces"
refs:
  - "[code://packages/activepieces/src/plugin.ts#L196-L213](../../../../packages/activepieces/src/plugin.ts#L196-L213) - `apply`, where each piece becomes an adapter"
  - "[code://packages/activepieces/src/mapping.ts#L219-L226](../../../../packages/activepieces/src/mapping.ts#L219-L226) - `adapterOf`, which gets the icon"
  - "[code://packages/activepieces/src/child.ts](../../../../packages/activepieces/src/child.ts) - the child that describes each piece, and must also send its `logoUrl`"
---

## Objective

Each adapter of an Activepieces piece has the piece's logo as a `data:` icon.
The logo is fetched once and cached on disk, and a failure means no icon.

## Files

- `UPDATE: packages/activepieces/src/child.ts` - send the piece's `logoUrl` with its description.
- `CREATE: packages/activepieces/src/logos.ts` - `logoOf(piece, url, dir)`, which reads the cache or fetches the logo once.
- `UPDATE: packages/activepieces/src/plugin.ts:196-213` - get the logo of each piece before it registers the adapter.
- `UPDATE: packages/activepieces/src/mapping.ts:219-226` - put the icon on the adapter when there is one.
- `UPDATE: packages/activepieces/test/` - cases for the cache, a failed fetch and a large logo.
- `UPDATE: docs/plugins/activepieces.md` - say that each piece shows its logo, and that the logos are the brands' marks.

## Steps

1. Add `logoUrl` to the description that the child sends for each piece.
2. Write `logoOf`, which reads `<configDir>/activepieces/icons/<piece>.png` when the file exists.
3. Fetch the `logoUrl` with a timeout of 5 seconds when there is no cached file.
4. Write the logo to the cache only when the fetch succeeds and the body is at most 32 KB.
5. Answer no icon, with one problem line, when the fetch fails or the body is too large.
6. Take `contentType` from the response header, and fall back to `image/png`.
7. Fetch the logos of all pieces in parallel, so one slow logo does not hold the others.
8. Give `adapterOf` the icon as `{ src: "data:...", contentType }`.
9. Add tests with a fake `fetch` for a cache hit, a failed fetch and a large body.

## Validation

- `npm test -w packages/activepieces` passes, with the new cases.
- With the config-dev pieces, the adapters channel rows have icons, and a second start makes no logo fetch.

## Resume

