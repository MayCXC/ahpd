---
title: Each release is a docs page, with a sidebar of its own and an archive - implemented
date: 2026-10-29
refs:
  - git://86d634af
  - "[code://docs/.vitepress/releases.ts](../../../../docs/.vitepress/releases.ts)"
  - "[code://docs/.vitepress/config.mts](../../../../docs/.vitepress/config.mts)"
---

The docs site has an *Updates* section, with one page for each minor release.
A sidebar lists the newest releases, and an archive lists all of them by year.
`CHANGELOG.md` is one line that links to the pages.

## What was built

- `docs/updates/v0_11.md` to `v0_14.md` - each release, with *The good stuff* first and one section for each patch release, newest first.
- `docs/updates/archive.md` and `docs/updates/releases.data.ts` - every release as a link, grouped by year.
- [`code://docs/.vitepress/releases.ts`](../../../../docs/.vitepress/releases.ts) - the releases, read from the file names and the `date` frontmatter, newest first.
- [`code://docs/.vitepress/config.mts`](../../../../docs/.vitepress/config.mts) - two sidebars keyed by path, the check on unlisted pages over both, and *Updates* in the nav.
- [`code://CHANGELOG.md`](../../../../CHANGELOG.md), [`code://docs/README.md`](../../../../docs/README.md), [`code://docs/server/UPGRADE.md`](../../../../docs/server/UPGRADE.md) and [`code://DEVELOPER.md`](../../../../DEVELOPER.md) - the link line, the `updates` index section, the link to the notes, and the publishing step.

## Verified

- `pnpm docs:build` passes, and every anchor in *The good stuff* resolves.
- The 218 list items of `CHANGELOG.md` at `86d634af` match the list items of the four pages.
- Screenshots of `/updates/v0_14`, `/updates/archive` and `/server/UPGRADE` at 1480x1000, and `/updates/v0_14` at 390x844.

## Departures from the plan

- The archive reads the shared `releases.ts` through a data loader, not `createContentLoader`, so the sidebar and the archive use one list.

## Left for later

- none.
