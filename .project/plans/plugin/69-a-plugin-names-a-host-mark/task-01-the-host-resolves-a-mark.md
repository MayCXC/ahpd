---
title: The host resolves a mark
status: implemented
depends: []
layer: "server"
refs:
  - "[code://packages/server/src/icons.ts#L82](../../../../packages/server/src/icons.ts#L82) - `resolveIcons`, which gains the `mark:` source"
  - "[code://packages/server/src/proxy/adapters.ts#L268-L282](../../../../packages/server/src/proxy/adapters.ts#L268-L282) - the proxy adapters read the same folder by path"
  - "[code://docs/plugins/PLUGINS.md#L1205](../../../../docs/plugins/PLUGINS.md#L1205) - the Icons section of the plugin docs"
  - https://cdn.simpleicons.org - the source of the four new marks
---

## Objective

`{ "src": "mark:<name>" }` in a manifest or in `Adapter.icons` resolves to `packages/server/icons/<name>.svg` as a `data:` icon.
Where `<name>-dark.svg` exists, a second icon with `theme: "dark"` follows it.
The folder holds the Jira, Linear, Resend and WhatsApp marks.

## Files

- `UPDATE: packages/server/src/icons.ts:82` - resolve a `mark:` source against the server's `icons` folder, with its dark file.
- `CREATE: packages/server/icons/jira.svg` - the Jira mark from Simple Icons, in its brand colour.
- `CREATE: packages/server/icons/linear.svg` - the Linear mark from Simple Icons, in its brand colour.
- `CREATE: packages/server/icons/resend.svg` - the Resend mark from Simple Icons, in its brand colour.
- `CREATE: packages/server/icons/whatsapp.svg` - the WhatsApp mark from Simple Icons, in its brand colour.
- `UPDATE: packages/server/test/plugin-icons.test.ts` - cases for a mark, a mark with a dark file, an unknown mark and a name with a path in it.
- `UPDATE: docs/plugins/PLUGINS.md:1205` - say how a plugin names a mark, and list the marks the host ships.
- `UPDATE: .project/pending/plugin-58-icon-curation.md` - one row for each new mark.

## Steps

1. Download each mark from `https://cdn.simpleicons.org/<slug>`, with the slugs `jira`, `linear`, `resend` and `whatsapp`.
2. Add an XML comment to each file that names Simple Icons and CC0 1.0.
3. Check that no file holds a script, an event attribute or an external reference, and keep each under 32 KB.
4. In `resolveIcons`, read a `src` that starts with `mark:` as the name of a file in the server's `icons` folder.
5. Accept a name of lowercase letters, digits and `-` only, and drop any other name with one problem line.
6. Resolve the folder from `import.meta.url`, as the proxy adapters do, so the daemon's working folder does not matter.
7. Send the light file, and add `<name>-dark.svg` with `theme: "dark"` when it exists.
8. Drop an unknown mark with one problem line that names the plugin and the mark.
9. Add the test cases, and update the Icons section of `PLUGINS.md`.
10. Add the four rows to the curation table.

## Validation

- `pnpm exec vitest run packages/server/test/plugin-icons.test.ts` passes, with the new cases.
- `npm pack --dry-run -w packages/server` lists the four new files under `icons/`.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.

## Resume

- **Done so far:** `resolveIcons` in `packages/server/src/icons.ts` reads a `src` that starts with `mark:` as a file in `packages/server/icons/`, resolved from `import.meta.url`, before the `https:` and `data:` cases. A name of lowercase letters, digits and `-` is accepted, and any other name gives one problem line. An unknown mark gives one problem line that names the plugin and the mark. The light file is sent with no `theme`, and `<name>-dark.svg` follows it with `theme: "dark"` where it exists. The folder gained `jira.svg`, `linear.svg`, `resend.svg` and `whatsapp.svg`, each from Simple Icons under CC0 1.0 with an XML comment, under 32 KB, and with no script, event attribute or external reference. `plugin-icons.test.ts` has four new cases: a mark read with no package, a mark with a dark file, an unknown mark through the loader, and a name holding a path.
- **Next action:** none; task 03 builds on this.
- **Files:** `packages/server/src/icons.ts`, `packages/server/icons/jira.svg`, `packages/server/icons/linear.svg`, `packages/server/icons/resend.svg`, `packages/server/icons/whatsapp.svg`, `packages/server/test/plugin-icons.test.ts`, `docs/plugins/PLUGINS.md`, `.project/pending/plugin-58-icon-curation.md`, this task file.
- **Open questions:** whether the black Resend mark needs a dark file, which the Files list does not name.
- **Departures:** none.
- **Watch out for:** the mark name is checked before any file is read, so a name such as `../openai` never leaves the folder.
