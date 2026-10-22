---
title: The docs say the grant and the path
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** the docs are not hard-wrapped; keep one paragraph on one line.
