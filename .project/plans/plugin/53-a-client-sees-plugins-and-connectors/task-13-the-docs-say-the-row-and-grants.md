---
title: The docs say the new row fields and the grants
status: todo
depends: [task-10-a-plugin-row-says-what-loaded.md, task-11-a-plugin-command-marks-a-restart.md, task-12-plugins-and-connectors-have-grants.md]
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - the plugin channel and the connectors channel"
  - "[code://docs/sdk/USERS.md](../../../../docs/sdk/USERS.md) - the table of subjects the host decides"
  - "[code://CHANGELOG.md](../../../../CHANGELOG.md) - `0.14.0 - unreleased`"
---

## Objective

A person reads the new row fields, the restart mark and the new grants in the docs.
The changelog says which grant a role adds to keep its access.

## Files

- `UPDATE: docs/plugins/PLUGINS.md` - the row fields `version`, `loaded`, `loadProblem` and `optionsSchema`, the restart mark, and the grants of both channels.
- `UPDATE: docs/sdk/USERS.md` - the `plugin` and `connector` subjects in the table, which then has thirteen.
- `UPDATE: CHANGELOG.md` - the new fields, the restart mark, and the grant change as a break.

## Steps

1. Add the four row fields to the plugin channel section of `PLUGINS.md`.
2. Say in `PLUGINS.md` that the three plugin commands set `ahpd.restartNeeded` for every client.
3. Replace the `config` grants of both channels in `PLUGINS.md` with the new ones.
4. Add the `plugin` and `connector` rows to the subject table in `USERS.md`, and correct its count.
5. Add the changes to `0.14.0 - unreleased`, with the grant change under its breaks.
6. Run `pnpm -s docs:build`, and set this task and the plan row to `implemented`.

## Validation

- `PLUGINS.md` names `version`, `loaded`, `loadProblem`, `optionsSchema` and `ahpd.restartNeeded`.
- `USERS.md` lists `plugin` and `connector` with their operations.
- `CHANGELOG.md` says a role that read these channels with `config:read` now needs `plugin:read` or `connector:read`.
- `pnpm -s docs:build` passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** nothing.
