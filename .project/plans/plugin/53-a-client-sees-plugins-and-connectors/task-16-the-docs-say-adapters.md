---
title: The docs say adapters, connectors and their grants
status: todo
depends: [task-15-adapters-and-connectors-split.md]
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - the connectors channel section and the registration kinds"
  - "[code://docs/sdk/USERS.md](../../../../docs/sdk/USERS.md) - the table of subjects the host decides"
  - "[code://docs/sdk/HOST.md](../../../../docs/sdk/HOST.md) - the grants table"
  - "[code://CHANGELOG.md](../../../../CHANGELOG.md) - `0.14.0 - unreleased`"
  - "[code://.project/plans/plugin/00-plugin.md](../../00-plugin.md) - the glossary and the registration table"
---

## Objective

A person reads in the docs that a plugin registers adapters and a person makes connectors from them.
The docs say which grant each connector action takes.

## Files

- `UPDATE: docs/plugins/PLUGINS.md` - `registerAdapter`, the two channels, their rows and their grants.
- `UPDATE: docs/sdk/USERS.md` - the `connector` row with `all` and `host`.
- `UPDATE: docs/sdk/HOST.md` - the connector grants in the grants table.
- `UPDATE: CHANGELOG.md` - the adapter names, the two channels and the new grant rules under `0.14.0 - unreleased`.
- `UPDATE: .project/plans/plugin/00-plugin.md` - "adapter" in the glossary and the registration table, in place of "connector kind".

## Steps

1. Replace `registerConnector` and "connector kind" with `registerAdapter` and "adapter" in `PLUGINS.md`.
2. Describe `x-ahpd-adapters` and its rows in `PLUGINS.md`.
3. Remove every mention of a `kind:` row from `PLUGINS.md`.
4. Write the grant of each owner in `PLUGINS.md`.
5. Add `all` and `host` to the `connector` row in `USERS.md`.
6. Correct the connector grants in `HOST.md`.
7. Add the changes to `0.14.0 - unreleased`, with the renames and the new grant rules under its breaks.
8. Replace "connector kind" with "adapter" in the glossary and the registration table of `00-plugin.md`.
9. Run `pnpm -s docs:build`, and set this task and the plan row to `implemented`.

## Validation

- `PLUGINS.md` names `registerAdapter` and `x-ahpd-adapters`, and has no `kind:` key.
- `USERS.md` lists `connector` with `list`, `all`, `put`, `remove` and `host`.
- `CHANGELOG.md` says a person needs `connector:put` to make their own connector.
- `rg -n "connector kind" docs .project/plans/plugin/00-plugin.md` finds nothing.
- `pnpm -s docs:build` passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** older plans keep "connector kind"; a path is an identity, so they stay as written.
