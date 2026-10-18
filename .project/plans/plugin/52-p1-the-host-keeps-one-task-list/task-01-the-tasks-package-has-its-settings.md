---
title: The tasks package has its settings
status: implemented
depends: []
layer: "tasks"
refs:
  - "[code://packages/bot/package.json](../../../../packages/bot/package.json) - the package layout and the `ahpd` manifest to copy"
  - "[code://packages/bot/src/plugin.ts#L65-L83](../../../../packages/bot/src/plugin.ts#L65-L83) - `defaults` and `optionsSchema` to copy"
  - "[code://packages/webhook/src/index.ts](../../../../packages/webhook/src/index.ts) - what a plugin's index exports"
  - "[code://package.json](../../../../package.json) - the root build script"
  - "[code://.github/workflows/release.yml](../../../../.github/workflows/release.yml) - `PUBLISHED`, the packages a release publishes"
  - "[code://docs/.vitepress/config.mts#L60-L77](../../../../docs/.vitepress/config.mts#L60-L77) - the plugin pages in the sidebar"
---

## Objective

`@ahpd/tasks` is a plugin package with the id `tasks`, and it declares its two settings with defaults.
Approval before an agent starts a task is off, and the sweep of finished plans is off.

## Files

- `CREATE: packages/tasks/package.json` - the package, with the `ahpd` manifest, a peer range on `@ahpd/sdk` and a `test` script.
- `CREATE: packages/tasks/tsconfig.json` - the build settings, copied from `packages/bot/tsconfig.json`.
- `CREATE: packages/tasks/README.md` - what the plugin does and its two settings.
- `CREATE: packages/tasks/LICENSE` - the MIT license, copied from `packages/bot/LICENSE`.
- `CREATE: packages/tasks/src/index.ts` - exports `apply`, `defaults`, `name`, `optionsSchema` and `title`.
- `CREATE: packages/tasks/src/plugin.ts` - `name`, `title`, `defaults`, `optionsSchema` and an `apply` that reads the two settings.
- `CREATE: packages/tasks/test/tasks-plugin.test.ts` - the settings and their defaults.
- `UPDATE: package.json` - add `tsc -p packages/tasks` to the build script, after `packages/webhook`.
- `UPDATE: .github/workflows/release.yml` - add `tasks` to `PUBLISHED`.
- `UPDATE: docs/.vitepress/config.mts:60-77` - add the `@ahpd/tasks` page and the `Tasks` page.
- `CREATE: docs/plugins/tasks.md` - the package page, which includes the README.

## Steps

1. Copy the layout of `packages/bot` into `packages/tasks`, without the bot sources.
2. Set `name` to `tasks` and `title` to `Tasks` in `plugin.ts` and in the `ahpd` manifest.
3. Declare `requireApproval` in `optionsSchema` as a boolean, with the default `false`.
4. Declare `sweepAfterDays` in `optionsSchema` as an integer, with no default, which means keep forever.
5. Read both settings in `apply`, and report a value of the wrong kind with `host.problem`.
6. Add the package to the build script, to `PUBLISHED` and to the docs sidebar.

## Validation

- `packages/tasks/test/tasks-plugin.test.ts`: with no options, approval is off and the sweep is off. A set value takes effect.
- `pnpm build` builds `packages/tasks`.
- `pnpm vitest run packages/tasks/test` passes.

## Resume

- **Done so far:** every step. `packages/tasks` has the bot's layout, the `ahpd` manifest with the id `tasks` and the title `Tasks`, and no bot sources. `plugin.ts` declares `requireApproval` (boolean, default `false`) and `sweepAfterDays` (integer, minimum 1, absent keeps forever). `settingsOf` reads both, reports a value of the wrong kind through the callback and keeps that setting's default. `apply` calls it with `host.problem`. The package is in the root build after `packages/webhook`, in `PUBLISHED` after `bot`, and in the docs sidebar as `@ahpd/tasks` and `Tasks`. `docs/plugins/tasks.md` includes the README. `pnpm-lock.yaml` takes the new workspace package from the install.
- **Next action:** task 02.
- **Open questions:** none.
- **Watch out for:** `settingsOf` is exported from `plugin.ts` and not from `index.ts`, which exports the five names task 01 names. The test imports it from the module. The sweep has no default, so `defaults` holds `requireApproval` alone.
