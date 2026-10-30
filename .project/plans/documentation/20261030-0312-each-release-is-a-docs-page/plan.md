---
title: Each release is a docs page, with a sidebar of its own and an archive
domain: documentation
status: built
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - git://86d634af - the commit of this repository the facts were checked at
  - "[code://CHANGELOG.md](../../../../CHANGELOG.md) - every change of 0.11.0 to 0.14.1, one section for each release; the source of the pages"
  - "[code://docs/.vitepress/config.mts#L21-L81](../../../../docs/.vitepress/config.mts#L21-L81) - the sidebar, one hand-written group for each folder"
  - "[code://docs/.vitepress/config.mts#L96-L98](../../../../docs/.vitepress/config.mts#L96-L98) - the build fails on a page the sidebar does not list"
  - "[code://docs/.vitepress/config.mts#L198](../../../../docs/.vitepress/config.mts#L198) - the top nav"
  - "[code://docs/README.md](../../../../docs/README.md) - the index of all documents, one section for each folder"
  - "[code://docs/server/UPGRADE.md](../../../../docs/server/UPGRADE.md) - the upgrade page, which links to the notes of each release"
  - "[code://DEVELOPER.md#L124-L135](../../../../DEVELOPER.md#L124-L135) - the publishing steps, which gain the release page"
  - "[code://.project/plans/documentation/00-documentation.md](../00-documentation.md) - the domain contracts, which gain the updates folder"
  - npm://vitepress@^1.6.4 - a sidebar keyed by path, and `createContentLoader` for the archive
  - https://code.visualstudio.com/updates/v1_142 - the page Softov named as the model
  - https://github.com/microsoft/vscode-docs/blob/8b9db598747766c67963cefb8c316ee479d4bc2c/release-notes/v1_142.md - its source, checked at that commit
---

## Goal

The ahpd docs site gets an *Updates* section, as VS Code has at `code.visualstudio.com/updates/v1_142`.
Each minor release is one page in `docs/updates/`, with the complete record of the release and its patch releases.
A page starts with *The good stuff*: a short paragraph and links to the best changes.
The pages have a sidebar of their own, with the newest releases and a link to an archive of all of them.
`CHANGELOG.md` becomes one line that links to the pages.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.
The brief `briefs/each-release-is-a-docs-page.md` was never committed; this plan holds all of it.

### Searches performed

- `rg -n CHANGELOG -g '!CHANGELOG.md' -g '!.project/**' .` - nothing in the code, the workflows or the docs reads or links `CHANGELOG.md`.
- `rg -l "UPDATE: CHANGELOG.md" .project/plans` - 39 task files, every one `done` or `implemented`. No open task writes the file.
- `rg -n "^### " CHANGELOG.md` - 0.14.1 has *Sessions and VS Code parity* twice.
- `ls docs/BOTS.md docs/AUTOMATIONS.md` - neither exists; the 0.11.0 notes link both. They are `docs/plugins/BOTS.md` and `docs/sdk/AUTOMATIONS.md` now.

### Runtime path

```
docs/updates/v0_NN.md -> releases.ts reads the files and their dates -> config.mts sidebar and nav, releases.data.ts -> archive.md -> the site
```

### Gaps

- The sidebar is one list, so the site cannot show a second menu on some pages.
- The check on unlisted pages reads only that one list.
- Nothing lists the releases.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One page for each minor release in `docs/updates/`, named `v0_NN.md` | Softov, 2026-10-29: "like a folder, where each file is a update. v0_14" | 01 |
| Each page is the complete record; `CHANGELOG.md` becomes a link | Softov, 2026-10-29: "Pages are complete" | 01 |
| A patch release is a `##` section of its own, newest first, with its date | Softov, 2026-10-29: "a patch release get a section" | 01 |
| A page starts with *The good stuff* | Softov, 2026-10-29: "highlights are welcome.. but another name maybe", then "The good stuff" | 01 |
| `docs/server/UPGRADE.md` links to the pages | Softov, 2026-10-29: "Upgrade page, a link could be welcome." | 01 |
| The pages have a sidebar of their own; other pages keep theirs | Softov, 2026-10-29: "Own sidebar" | 02 |
| An archive page lists every release by year, with *View all releases* in the sidebar | Softov, 2026-10-29: "the view all is another page with the references only" | 02 |
| The sidebar shows the newest 10 releases | (defaulted: VS Code shows 14; ahpd has 4) | 02 |
| A duplicate area section in one release is merged into one | (defaulted: one heading is one anchor) | 01 |
| A link to a page that moved points at its new place | (defaulted: VitePress fails the build on a dead link) | 01 |
| The other area names stay as written | (defaulted: the move changes no wording of the notes) | 01 |
| Build all of it now | Softov, 2026-10-29: "Build the whole brief" | 01, 02 |

## Proposed architecture

- **Data flow** - `docs/.vitepress/releases.ts` reads `docs/updates/v*.md`, with the `date` of each page, and answers the releases newest first. `config.mts` builds the releases sidebar and the nav link from it. `docs/updates/releases.data.ts` hands the same list to `archive.md`.
- **State flow** - none; the site is static.
- **Layer responsibilities** - `releases.ts`: the list of releases, read once. · `config.mts`: two sidebars keyed by path, and the check over both. · `archive.md`: the links, grouped by year.
- **Source-of-truth files** - the files in `docs/updates/`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - each release is a page](task-01-each-release-is-a-page.md) | done | - |
| [02 - the site lists the releases](task-02-the-site-lists-the-releases.md) | done | 01 |

## Risks and tradeoffs

- A branch that adds a line to `CHANGELOG.md` conflicts after the merge - its entry moves to `docs/updates/v0_14.md`.
- The page of a new minor release is written by hand at release - `DEVELOPER.md` names it as a publishing step.

## Resume state

- **Done so far:** tasks 01 and 02; see [implemented.md](implemented.md).
- **Next action:** Softov reviews the pages and *The good stuff* text before the commit.
- **Watch out for:** a link in the notes is relative to the repository root and must become relative to `docs/updates/`.

## Final verification checklist

- [x] `pnpm docs:build` passes.
- [x] `/updates/v0_14` shows the releases sidebar, and `/server/UPGRADE` shows the docs sidebar.
- [x] The archive lists 0.11 to 0.14 under 2026.
- [x] Every link in *The good stuff* lands on its section.
