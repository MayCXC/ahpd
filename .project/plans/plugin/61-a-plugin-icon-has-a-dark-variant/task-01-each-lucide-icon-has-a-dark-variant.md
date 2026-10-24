---
title: Each Lucide icon has a dark variant
status: implemented
depends: []
layer: "packages"
refs:
  - "[code://packages/webhook/src/adapter.ts](../../../../packages/webhook/src/adapter.ts) - the adapter's `icons` list"
  - "[code://packages/server/test/plugin-icons.test.ts](../../../../packages/server/test/plugin-icons.test.ts) - the tests for the icons our plugins ship"
  - "[code://.project/pending/plugin-58-icon-curation.md](../../../pending/plugin-58-icon-curation.md) - the curation file this task extends"
---

## Objective

Each of the eight plugins with a Lucide icon ships a light and a dark variant.
The manifest names both, each with its `theme`.

## Files

- `UPDATE: packages/agent-acp/icon.svg` - stroke in `#1F2328`.
- `CREATE: packages/agent-acp/icon-dark.svg` - the same drawing, stroke in `#E6EDF3`.
- `UPDATE: packages/agent-cofold/icon.svg` - stroke in `#1F2328`.
- `CREATE: packages/agent-cofold/icon-dark.svg` - the same drawing, stroke in `#E6EDF3`.
- `UPDATE: packages/bot/icon.svg` - stroke in `#1F2328`.
- `CREATE: packages/bot/icon-dark.svg` - the same drawing, stroke in `#E6EDF3`.
- `UPDATE: packages/computer/icon.svg` - stroke in `#1F2328`.
- `CREATE: packages/computer/icon-dark.svg` - the same drawing, stroke in `#E6EDF3`.
- `UPDATE: packages/push/icon.svg` - stroke in `#1F2328`.
- `CREATE: packages/push/icon-dark.svg` - the same drawing, stroke in `#E6EDF3`.
- `UPDATE: packages/tasks/icon.svg` - stroke in `#1F2328`.
- `CREATE: packages/tasks/icon-dark.svg` - the same drawing, stroke in `#E6EDF3`.
- `UPDATE: packages/tunnel-devtunnel/icon.svg` - stroke in `#1F2328`.
- `CREATE: packages/tunnel-devtunnel/icon-dark.svg` - the same drawing, stroke in `#E6EDF3`.
- `UPDATE: packages/webhook/icon.svg` - stroke in `#1F2328`.
- `CREATE: packages/webhook/icon-dark.svg` - the same drawing, stroke in `#E6EDF3`.
- `UPDATE: packages/agent-acp/package.json` - two entries in `ahpd.icons`, and `icon-dark.svg` in `files`.
- `UPDATE: packages/agent-cofold/package.json` - two entries in `ahpd.icons`, and `icon-dark.svg` in `files`.
- `UPDATE: packages/bot/package.json` - two entries in `ahpd.icons`, and `icon-dark.svg` in `files`.
- `UPDATE: packages/computer/package.json` - two entries in `ahpd.icons`, and `icon-dark.svg` in `files`.
- `UPDATE: packages/push/package.json` - two entries in `ahpd.icons`, and `icon-dark.svg` in `files`.
- `UPDATE: packages/tasks/package.json` - two entries in `ahpd.icons`, and `icon-dark.svg` in `files`.
- `UPDATE: packages/tunnel-devtunnel/package.json` - two entries in `ahpd.icons`, and `icon-dark.svg` in `files`.
- `UPDATE: packages/webhook/package.json` - two entries in `ahpd.icons`, and `icon-dark.svg` in `files`.
- `UPDATE: packages/webhook/src/adapter.ts` - the adapter names both files.
- `UPDATE: packages/server/test/plugin-icons.test.ts` - each of the eight plugins sends a light and a dark icon.
- `UPDATE: .project/pending/plugin-58-icon-curation.md` - a dark column and the two stroke colours.

## Steps

1. Replace `stroke="currentColor"` with `stroke="#1F2328"` in each of the eight `icon.svg` files.
2. Copy each file to `icon-dark.svg` in the same folder, with `stroke="#E6EDF3"`.
3. Keep the Lucide licence comment in each new file.
4. Set `ahpd.icons` to `[{ "src": "./icon.svg", "theme": "light" }, { "src": "./icon-dark.svg", "theme": "dark" }]` in each manifest.
5. Add `icon-dark.svg` to `files` in each manifest.
6. Give the webhook adapter the same two icons, with their `theme`.
7. Leave the Activepieces, Claude and pi icons as they are.
8. Add a test that loads each of the eight plugins and finds one `light` and one `dark` `data:` icon.
9. Add a dark column and the two colours to the curation file.
10. Stop and ask Softov to curate both colours in ahpw, on a light and on a dark background.

## Validation

- The new test passes, and the gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.
- `rg -n currentColor packages/*/icon*.svg` finds nothing.
- `npm pack --dry-run` in `packages/bot` lists `icon.svg` and `icon-dark.svg`.
- By hand: Softov sees each icon in ahpw on a light and on a dark background.

## Resume

- **Done so far:** each of the eight Lucide packages ships `icon.svg`, which strokes in `#1F2328`, and `icon-dark.svg`, which strokes in `#E6EDF3`. Each new file keeps the Lucide licence comment. Each of the eight manifests names the two icons with their `theme` and lists `icon-dark.svg` in `files`. The webhook adapter names the same two files. `packages/server/test/plugin-icons.test.ts` reads each of the eleven manifests. The eight Lucide ones find one `light` and one `dark` `data:` icon. The Activepieces, Claude and pi marks keep one icon with no `theme`. It also checks both files of each Lucide package for the size limit, a script and an event attribute, and that `files` names both. `.project/pending/plugin-58-icon-curation.md` has a dark column and the two stroke colours, and waits for your curation.
- **Next action:** you curate `#1F2328` and `#E6EDF3` in ahpw, on a light and on a dark background. Replace a rejected file at the same path.
- **Files:** in `packages/{agent-acp,agent-cofold,bot,computer,push,tasks,tunnel-devtunnel,webhook}`, each `icon.svg`, `icon-dark.svg` and `package.json`; also `packages/webhook/src/adapter.ts`, `packages/server/test/plugin-icons.test.ts`, `.project/pending/plugin-58-icon-curation.md`, this task file, the plan and the index. The session cannot commit, so they are left in the worktree.
- **Open questions:** none. Every row of the plan's Answers table holds.
- **Departures:** the test reads each manifest with `readManifest`, as plan 58's test does, and not a full plugin load. Several of the eleven plugins need options and services a test host does not have. The curation file now names plan 61 in its `plans` list, beside plan 58. The test run leaves `packages/sdk/test/fixtures/wire.jsonl` dirty; `git checkout -- packages/sdk/test/fixtures/wire.jsonl` is denied in this session, so Softov restores it.
- **Watch out for:** a client that ignores `theme` draws the first icon. The light variant comes first in each list, so such a client draws what it drew before.
