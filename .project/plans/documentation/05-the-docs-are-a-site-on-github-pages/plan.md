---
title: The docs are a site on GitHub Pages, in server, sdk and plugins folders
domain: documentation
status: built
priority: medium
created: 2026-10-14
revalidated: 2026-10-14
refs:
  - "[code://docs/README.md](../../../../docs/README.md) - the index of the 21 area files; it stays at the root of `docs/` and lists the three folders"
  - "[code://docs/sdk/AGENT.md](../../../../docs/sdk/AGENT.md) - links into `../packages/` and `../examples/`, which are outside `docs/`"
  - "[code://packages/bot/test/bot-docs.test.ts#L16](../../../../packages/bot/test/bot-docs.test.ts#L16) - reads `docs/plugins/BOTS.md` from disk, which was `docs/BOTS.md` before the move"
  - "[code://README.md](../../../../README.md) - links to the area files by path"
  - "[code://package.json](../../../../package.json) - the workspace root, where the scripts and the dev dependency go"
  - "[code://.github/workflows/ci.yml](../../../../.github/workflows/ci.yml) - the pnpm and Node setup the deploy workflow copies"
  - npm://vitepress@^1.6.4 - the site generator, with its default theme, its theme toggle, its local search and its `@include`
  - https://github.com/microsoft/agent-host-protocol/blob/main/.github/workflows/deploy.yml - the Pages deploy this plan copies: build, upload the artifact, deploy
  - https://github.com/microsoft/agent-host-protocol/blob/main/docs/.vitepress/config.mts - the config shape: nav, sidebar, local search, edit link
  - https://vitepress.dev/guide/deploy#github-pages - the base path and the Pages source that a project site needs
---

## Goal

The files in `docs/` move into three folders, one for each kind of reader.
`server/` is for a person who runs the daemon.
`sdk/` is for a person who builds a host with `@ahpd/sdk`.
`plugins/` is for plugins.
`plugins/` has a guide to writing a plugin and one page for each plugin that ships in this repository.
The docs then become a documentation site at `https://softov.github.io/ahpd/`.
The site has a light theme and a dark theme with a toggle, and a search box over every page.
The Markdown stays the source, so the files read the same on GitHub as on the site.
A push to `main` publishes the site.
A later move to a domain such as `ahpd.ahpio.com` changes one setting and adds one file.
ahpc gets its own site later, in its own repository, with the same shape.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `ls docs` - 21 area files and `README.md`, no images, no `index.md`.
- `grep -o '](\.\./[^)]*)' docs/*.md` - 43 links point outside `docs/`, into `packages/`, `examples/`, `REFERENCE.md` and `.project/decisions/`.
- `grep -rln 'docs/[A-Z]*\.md'` outside `docs/` - 678 files name an area file by path, most of them under `.project/`.
- `grep -rn 'docs/[A-Z]*\.md' packages --include=*.ts` - 36 lines; one of them, in `bot-docs.test.ts`, reads the file.
- `ls packages/*/README.md` - 11 READMEs; 9 of them are plugins, and each says how to configure its plugin (plan documentation 04).
- `grep -l '```mermaid' docs/*.md` - no file uses Mermaid, so the site needs no diagram plugin.
- `ls .github/workflows` - `ci.yml`, `parts-bump.yml` and `release.yml`; nothing publishes to Pages.

### Runtime path

```
push to main -> deploy-docs.yml -> pnpm docs:build -> docs/.vitepress/dist -> Pages artifact -> softov.github.io/ahpd/
```

### Gaps

- VitePress fails a build on a dead link, and the 43 links outside `docs/` are dead inside the site.
- `docs/README.md` is the index on GitHub, but VitePress serves `index.md` as the home page.
- The plugin READMEs are outside `docs/`, so the site cannot show them without an include.
- The repository has no Pages source set; the workflow cannot deploy until it is set to GitHub Actions.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Each project has its own docs site; ahpc follows after ahpd, not merged | Softov, 2026-10-14: "ahpc in its own. after ahpd. not merged doc." | 02 |
| The site source lives in ahpd's `docs/` | Softov, 2026-10-14, question "Where should the docs site's source live?" | 02 |
| First address `softov.github.io/ahpd/`, a subdomain such as `ahpd.ahpio.com` maybe later | Softov, 2026-10-14: "initially can be on softov.github.io. latter on ahpd.ahpio.com" | 02, 03 |
| VitePress, as in the protocol's docs, with its light and dark themes and its local search | Softov, 2026-10-14: "something like doc from /github/agent-host-protocol", "dark and light theme", "search" | 02 |
| The docs split into `docs/server/`, `docs/sdk/` and `docs/plugins/`, and the files move on disk | Softov, 2026-10-14: "folder server and folder sdk? ... and folder for plugins?"; question "How should the split be done?": "Move the files" | 01 |
| `plugins/` has the guide to writing a plugin and one page per shipped plugin, which includes the package README | Softov, 2026-10-14, question "What goes in the plugins section?" | 01, 02 |
| A page goes to the folder of the package that defines its subject: `sdk/` for a person who codes, `server/` for a person who runs the daemon, with its CLI and MCP | Softov, 2026-10-15, to "Where do the host pages go?" - "I want doc where its defined, in the sdk for who codes, and on server for who uses" | 01 |
| `sdk/`: AHP, AGENT, LIBRARY, HOST, SESSIONS, CHATS, RESOURCES, TOOLS, TERMINALS, AUTOMATIONS, POLICY, USAGE, USERS, AUTHENTICATION | Softov, 2026-10-15, to "Sorted by where each subject is defined in code, the docs split like this. Use this split?" - "Use this split" | 01 |
| `server/`: DAEMON, PROXY, and the CLI pages split out of USERS, AUTHENTICATION and USAGE | Softov, 2026-10-15, the same answer | 01 |
| `plugins/`: PLUGINS, BOTS, COMPUTER, CONTAINERS, WEBHOOKS, and a page per plugin package | Softov, 2026-10-15, the same answer; `@ahpd/computer` defines containers | 01 |
| The `ahpd` CLI sections of USERS, AUTHENTICATION and USAGE move to `server/` pages of the same name, and each links to its `sdk/` page | Softov, 2026-10-15, to "Where do those CLI parts go?" - "Split into server pages" | 01 |
| The topic page is `docs/plugins/COMPUTERS.md`, and the package page stays `docs/plugins/computer.md`, because VitePress keys pages without case and the two names collide | Softov, 2026-10-15, to "computer.md and COMPUTER.md collide in VitePress. Which name changes?" | 01, 02 |
| `docs/server/USERS.md` keeps the whole "Turning it on" section, and `docs/sdk/USERS.md` links to it | Softov, 2026-10-15, to "How much of USERS goes to the server page?" | 01 |
| The site takes the ahpw palette: scena's dark slate and its teal accent `#4ec9b0`, with the darker `#0c7061` in the light theme | Softov, 2026-10-15, to "Which dark palette should the docs site use?" - "ahpw slate + teal" | 02 |
| The home page tagline is the `description` in `package.json`, and the three folders are its features, for Softov to rewrite | Softov, 2026-10-15, to "What does the home page say?" | 02 |
| `docs/README.md` stays at the root of `docs/` and lists the files by folder | `(defaulted: GitHub shows it when a reader opens docs/)` | 01 |
| A page per plugin is `docs/plugins/<package>.md`, named by its folder under `packages/` | `(defaulted: one name per plugin, the one the repository already uses)` | 01 |
| Every path to a moved file is rewritten, in code, READMEs and `.project/`, except `CHANGELOG.md` | `(defaulted: a ref says where something is, so it must stay true; a changelog entry records the past)` | 01 |
| VitePress is a dev dependency of the workspace root only | `(defaulted: no package ships it)` | 02 |
| The base path is `DOCS_BASE`, with `/ahpd/` when it is not set | `(defaulted: the move to a subdomain sets DOCS_BASE=/ and adds docs/public/CNAME)` | 02 |
| A link outside `docs/` becomes a link to the file on GitHub at `main`, at build time | `(defaulted: the Markdown keeps its relative links, so GitHub still renders them)` | 02 |
| `docs/index.md` is a new home page; `docs/README.md` is the "All documents" page | `(defaulted: front matter in README.md would show as a table on GitHub)` | 02 |
| The sidebar has one group per folder, and the URL follows the folder | `(defaulted: the site and GitHub show one structure)` | 02 |
| URLs keep the upper-case file names, with `cleanUrls` | `(defaulted: no rewrite map to keep in step with the files)` | 02 |
| The theme is VitePress's default theme, with the palette in `custom.css` | `(defaulted: one variable to change)` | 02 |
| A push to `main` that touches `docs/` or a plugin README deploys, and the workflow also runs by hand | `(defaulted: as the protocol's deploy.yml, narrowed by path)` | 03 |

## Proposed architecture

- **Data flow** - `docs/**/*.md` and `packages/*/README.md` -> VitePress with `docs/.vitepress/config.mts` -> static HTML in `docs/.vitepress/dist`.
- **Event flow** - a push to `main` under `docs/` or to a plugin README runs `deploy-docs.yml`, which builds and deploys to Pages.
- **State flow** - none; the site is static and the search index is built into it.
- **Layer responsibilities** - `docs/server/`, `docs/sdk/`, `docs/plugins/`: the pages, as Markdown · `docs/.vitepress/`: config, theme and the link rewrite · `.github/workflows/deploy-docs.yml`: build and publish.
- **Source-of-truth files** - [`code://docs/README.md`](../../../../docs/README.md) for what each page covers.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The docs live in server, sdk and plugins folders](task-01-docs-live-in-server-sdk-plugins-folders.md) | done | - |
| [02 - The docs build as a VitePress site](task-02-the-docs-build-as-a-vitepress-site.md) | done | 01 |
| [03 - A push to main publishes the site](task-03-a-push-to-main-publishes-the-site.md) | done | 02 |

## Risks and tradeoffs

- A missed path among about 700 files is a broken link - task 01 ends with a search for each old path.
- A branch that is open during the move still names the old paths - the rewrite is one commit, so a rebase sees one change.
- A new page is not in the sidebar until somebody adds it - task 02 fails the build when a page is missing from the sidebar.
- A link in an included README is relative to the package, not to the page - task 02 resolves it against the README's folder.
- A wrong link from an included README is a dead link, and the build fails on it.
- The link rewrite points at `main` - the site is only built from `main`, so a page and the code it links agree.
- The Pages source is a repository setting that no file can set - Softov sets it to GitHub Actions once, before the first deploy.

## Resume state

- **Done so far:** built on 2026-10-15. See [implemented.md](implemented.md).
- **Next action:** set the Pages source to GitHub Actions before the first run of `deploy-docs.yml`.
- **Open questions:** none.
- **Watch out for:** do not add front matter to a page in `docs/` or to a package README, because GitHub renders it as a table.

## Final verification checklist

- [x] No path to an old `docs/<NAME>.md` location is left outside `CHANGELOG.md`.
- [x] `pnpm test:unit` passes, `bot-docs.test.ts` included.
- [x] `pnpm docs:build` passes with no dead link.
- [ ] The built site has a working theme toggle and a search box that finds a word from `docs/sdk/POLICY.md`.
- [ ] `DOCS_BASE=/ pnpm docs:build` builds a site whose links work from the root.
- [ ] The workflow run on `main` deploys and `https://softov.github.io/ahpd/` answers.
- [ ] `00-documentation.md` names the folders and the site.
- [x] `plans/index.md` updated.
