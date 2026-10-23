---
title: The docs say the grant and the path
status: implemented
depends: [task-01-the-channel-opens-to-a-list-reader.md, task-02-a-receive-capability-names-its-path.md]
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - the connectors channel and `Capability`"
  - "[code://docs/sdk/HOST.md](../../../../docs/sdk/HOST.md) - the channel grants"
  - "[code://docs/plugins/WEBHOOKS.md](../../../../docs/plugins/WEBHOOKS.md) - the connector URL"
  - "[code://CHANGELOG.md](../../../../CHANGELOG.md) - the unreleased section"
---

## Objective

The docs say which grant opens the connectors channel and how a client builds a connector's URL.

## Files

- `UPDATE: docs/plugins/PLUGINS.md` - the gate `connector:list`, and `path` on `Capability`.
- `UPDATE: docs/sdk/HOST.md` - the gate `connector:list`.
- `UPDATE: docs/plugins/WEBHOOKS.md` - the connector URL from `path`.
- `UPDATE: CHANGELOG.md` - the advert names `connector:list`, and the new field.

## Steps

1. Say in PLUGINS.md that `connector:list` opens the channel and `connector:all` reads every row.
2. Add `path` to the `Capability` table in PLUGINS.md.
3. Correct the connectors grant in HOST.md.
4. Say in WEBHOOKS.md how a client builds a connector's URL from `path`.
5. Add both changes to the changelog.
6. Run `pnpm -s docs:build`, and set this task and the plan row to `implemented`.

## Validation

- `rg -n "connector:all" docs` finds only the sentences on reading every row.
- `pnpm -s docs:build` passes.

## Resume

- **Done so far:** PLUGINS.md says `connector:list` opens the connectors channel and `connector:all` reads every row without it, and the adapter example and a bullet carry `path` beside the kinds of capability. HOST.md has a subscribe row for `connector:list`, and the `connector:all` row says it is admitted without it. WEBHOOKS.md says how a client builds an endpoint's URL from the capability's `path`. CHANGELOG.md has an Upgrading line on the new gate and a Plugins and connectors line on the field. `rg -n "connector:all" docs` finds only the two sentences on reading every row, and `pnpm -s docs:build` passes.
- **Next action:** none; the plan's final verification checklist is next.
- **Files:** `docs/plugins/PLUGINS.md`, `docs/sdk/HOST.md`, `docs/plugins/WEBHOOKS.md`, `CHANGELOG.md`, this task file, the plan and `plans/index.md`. The session cannot commit, so they are left in the worktree.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** PLUGINS.md mixes a hard-wrapped older prose with one-line paragraphs; the lines written here are one paragraph on one line, as the task says.
