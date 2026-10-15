---
title: ahpw exports `web` and serves `/plugins/web/`
status: implemented
depends: [task-01-ahpds-plugins-export-slugs.md]
layer: "ahpw"
refs:
  - https://github.com/softov/ahpw/blob/main/plugin/index.ts - `name` is `ahpd-web`, and `PREFIX` is built from it
  - https://github.com/softov/ahpw/blob/main/vite.config.ts - the comment on `base` names `/plugins/ahpd-web/`
  - https://github.com/softov/ahpw/blob/main/README.md - the URL to open after the daemon starts
  - https://github.com/softov/ahpw/blob/main/CHANGELOG.md - the release notes, in Keep a Changelog form
---

## Objective

ahpw's plugin exports `name = 'web'` and serves its page under `/plugins/web/`.
The `ahpd-web.` keys in `localStorage` are an app prefix, and they stay.
This task is committed in the ahpw repository.

## Files

- `UPDATE: plugin/index.test.ts:14-21` - the requests are under `/plugins/web/`.
- `UPDATE: plugin/static.test.ts:7-38` - the prefix is `/plugins/web/`.
- `UPDATE: plugin/index.ts:5-6` - `name` is `web`.
- `UPDATE: vite.config.ts:45` - the comment names `/plugins/web/`.
- `UPDATE: README.md:55` - the URL is `/plugins/web/`.
- `UPDATE: CHANGELOG.md:6` - an `Unreleased` entry for the new path.

## Steps

1. Change the two plugin tests to `/plugins/web/`, and see `index.test.ts` fail.
2. Change `name` in `plugin/index.ts` to `web`, and its comment to `/plugins/web/`.
3. Change the comment in `vite.config.ts` and the URL in `README.md`.
4. Add a `Changed` entry under `Unreleased` in `CHANGELOG.md` that names the new path and ahpd 0.12.0.
5. Run `pnpm typecheck` and `pnpm test`.

## Validation

- `plugin/index.test.ts` answers `ahpw.json` under `/plugins/web/`.
- `pnpm typecheck` and `pnpm test` pass in ahpw.
- `rg -n "plugins/ahpd-web" .` in ahpw finds only the old release notes.

## Resume

- **Done:** 2026-10-14, in ahpw commit `e500c19`. The plugin exports `name = 'web'` and serves its page under `/plugins/web/`.
- **Kept:** `README.md:164` names a folder, `/path/to/ahpd-web`, and not a route, so it stays.
- **Gates:** `pnpm typecheck` passes, and `pnpm test` passes with 282 tests.
- **Check:** `rg -n "plugins/ahpd-web"` finds only the `CHANGELOG.md` entries, the new one and the 0.1.0 one.
