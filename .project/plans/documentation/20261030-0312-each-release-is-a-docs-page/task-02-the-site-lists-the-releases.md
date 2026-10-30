---
title: The site lists the releases in a sidebar of their own and an archive
status: done
depends: [task-01-each-release-is-a-page.md]
layer: "docs"
refs:
  - "[code://docs/.vitepress/config.mts](../../../../docs/.vitepress/config.mts) - the sidebar, the check on unlisted pages and the nav"
  - npm://vitepress@^1.6.4 - a sidebar keyed by path, and `createContentLoader`
---

## Objective

A page under `/updates/` shows the newest 10 releases and *View all releases* in its sidebar.
Every other page keeps the *Server*, *SDK* and *Plugins* sidebar.
`/updates/archive` lists every release by year, and the top nav has *Updates*.

## Files

- `CREATE: docs/.vitepress/releases.ts` - reads `docs/updates/v*.md` and answers each release's version, link and date, newest first.
- `CREATE: docs/updates/releases.data.ts` - the VitePress data loader that hands the releases to the archive.
- `CREATE: docs/updates/archive.md` - every release as a link, grouped by year.
- `UPDATE: docs/.vitepress/config.mts:21-98` - two sidebars keyed by path; the check reads both.
- `UPDATE: docs/.vitepress/config.mts:198` - an *Updates* link to the newest release.

## Steps

1. Write `releases.ts`, which reads the version from the file name and the date from the frontmatter.
2. Key the sidebar by path: `/updates/` gets the releases, `/` gets today's groups.
3. Make the releases sidebar the newest 10 and *View all releases*.
4. Make the check on unlisted pages read the links of both sidebars.
5. Add *Updates* to the nav, before *All documents*.
6. Write `releases.data.ts` and `archive.md`.

## Validation

- Run `pnpm docs:build`; it passes.
- Run `pnpm docs:preview` and open `/ahpd/updates/v0_14`, `/ahpd/updates/archive` and `/ahpd/server/UPGRADE`; check each sidebar by hand.

## Resume

`pnpm docs:build` passes.
Screenshots at 1480x1000 and 390x844 show the releases sidebar on `/updates/` only, and the archive under 2026.
