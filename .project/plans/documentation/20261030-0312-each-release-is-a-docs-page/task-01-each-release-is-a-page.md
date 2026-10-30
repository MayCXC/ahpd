---
title: Each release is a page in docs/updates
status: done
depends: []
layer: "docs"
refs:
  - "[code://CHANGELOG.md](../../../../CHANGELOG.md) - the notes the pages are moved from"
  - "[code://docs/server/UPGRADE.md](../../../../docs/server/UPGRADE.md) - gains the link to the pages"
  - "[code://DEVELOPER.md#L124-L135](../../../../DEVELOPER.md#L124-L135) - the publishing steps"
---

## Objective

`docs/updates/v0_11.md` to `v0_14.md` hold every change of their releases, each page with *The good stuff* first.
`CHANGELOG.md` is one line that links to them.

## Files

- `CREATE: docs/updates/v0_11.md` - the 0.11.0 notes.
- `CREATE: docs/updates/v0_12.md` - the 0.12.0 notes.
- `CREATE: docs/updates/v0_13.md` - the 0.13.0 notes.
- `CREATE: docs/updates/v0_14.md` - the 0.14.1 and 0.14.0 notes, 0.14.1 first.
- `UPDATE: CHANGELOG.md` - the notes go; one line links to `docs/updates/`.
- `UPDATE: docs/README.md` - an `updates` section.
- `UPDATE: docs/server/UPGRADE.md` - a link to the pages for the upgrade notes of each release.
- `UPDATE: DEVELOPER.md:124-135` - a publishing step that dates the release on its page, or writes the page of a new minor release.
- `UPDATE: .project/plans/documentation/00-documentation.md` - the updates folder as a contract.

## Steps

1. Give each page frontmatter with `title` and the `date` of its `.0` release.
2. Start each page with `# ahpd 0.NN`, then `## The good stuff`, then one `##` section for each release, newest first.
3. Move each release's sections from `CHANGELOG.md` without changing their words.
4. Merge the two *Sessions and VS Code parity* sections of 0.14.1 into one.
5. Rewrite each link to be relative to `docs/updates/`, and point `docs/BOTS.md` and `docs/AUTOMATIONS.md` at their pages now.
6. Write *The good stuff* of each page: one sentence and up to five links to sections on the page.
7. Replace the notes in `CHANGELOG.md` with one line that links to `docs/updates/` and to the archive on the site.
8. Add the `updates` section to `docs/README.md`, the link to `docs/server/UPGRADE.md`, and the step to `DEVELOPER.md`.
9. Add `docs/updates/` to the contracts in `00-documentation.md`.

## Validation

- Compare the list items of `CHANGELOG.md` at `86d634af` with the four pages; each item is on a page.
- Run `pnpm docs:build`; it passes after task 02.

## Resume

The four pages hold all 218 list items of `CHANGELOG.md` at `86d634af`, with the link targets set aside in the compare.
*The good stuff* of each page is agent-written and waits for Softov's review.
