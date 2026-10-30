---
title: Documentation - what exists today
domain: documentation
revalidated: 2026-09-19
---

The documentation is `docs/`, one file per area of the host, plus the files at the root that say what the reference is and what each pass against it found.
The files in `docs/` are in three folders, one for each kind of reader.
`docs/server/` is for a person who runs the daemon.
`docs/sdk/` is for a person who builds a host with `@ahpd/sdk`, and has the pages whose subject `@ahpd/sdk` defines.
`docs/plugins/` is for a person who writes a plugin, and has one page for each plugin package.
`docs/README.md` says what each file covers.
The same files build as a VitePress site, published at `https://softov.github.io/ahpd/`.
There is no package and no test: a document is correct when it describes the code as it is, so a change in behaviour is a change to the document that promised it.

## Packages

- There is none. The documents are the deliverable, and `docs/sdk/AHP.md` is the one that is authoritative about the surface.

## Contracts

- `code://docs/README.md` - the index: one table for each folder, with one line on each file, and the "All documents" page of the site.
- `code://docs/index.md` - the home page of the site.
- `code://docs/updates/` - the release notes: one `v<major>_<minor>.md` page for each minor release, with `title` and `date` front matter, and `archive.md`, which lists them by year.
- `code://docs/.vitepress/releases.ts` - reads the release pages, for the releases sidebar, the nav and the archive.
- `code://docs/.vitepress/config.mts` - the site: its two sidebars, one for the docs and one for the release notes, its search, the base path from `DOCS_BASE` and the rewrite of a link that leaves `docs/`.
- `code://docs/.vitepress/theme/` - the default theme, with the brand colour in `custom.css`.
- `code://.github/workflows/deploy-docs.yml` - builds the site and deploys it to GitHub Pages.
- `code://docs/sdk/AGENT.md` - writing a backend: the `Agent` interface, and what a backend owes it.
- `code://docs/sdk/AHP.md` - the surface: every command, action and well-known key this host serves, each with the row that says why.
- `code://docs/sdk/AUTHENTICATION.md` - how a client proves who it is: the door, the tokens, `authenticate` and the issuer.
- `code://docs/sdk/AUTOMATIONS.md` - automations: their triggers, the runs they make and the catalogue they live on.
- `code://docs/sdk/CHATS.md` - one conversation inside a session: its turns, its parts and its URI.
- `code://docs/plugins/COMPUTERS.md` - `@ahpd/computer`: making a machine, running a session inside it, and its profiles.
- `code://docs/plugins/CONTAINERS.md` - a session inside a folder's dev container.
- `code://docs/server/REFERENCE.md` - the command line: the verbs, the flags, and the configuration file that sits under them.
- `code://docs/sdk/HOST.md` - the host itself: what it announces, what it serves, and every setting it reads.
- `code://docs/sdk/LIBRARY.md` - using `@ahpd/sdk` to build a host rather than running this one.
- `code://docs/plugins/PLUGINS.md` - writing a plugin: the contract, what you may register and the manifest.
- `code://docs/sdk/POLICY.md` - who may use which agent, model and computer.
- `code://docs/server/PROXY.md` - the model proxy served under `/v1`.
- `code://docs/server/USERS.md` - the `users` key, the `--users` flag and the `ahpd user` commands; it links to `docs/sdk/USERS.md`.
- `code://docs/server/USERS.md` - the `ahpd user` commands that add a person and mint a token; it links to `docs/sdk/AUTHENTICATION.md`.
- `code://docs/server/USAGE.md` - the `ahpd usage` commands; it links to `docs/sdk/USAGE.md`.
- `code://docs/plugins/BOTS.md` - bots: the `bot:` scheme, the record a bot is and its session.
- `code://docs/plugins/WEBHOOKS.md` - webhooks: an endpoint that talks to a bot or fires an automation.
- `code://docs/plugins/<package>.md` - one page for each plugin package, which includes `packages/<package>/README.md`.
- `code://docs/sdk/RESOURCES.md` - what a resource is: the schemes, the `resource*` methods and the grants.
- `code://docs/sdk/SESSIONS.md` - what a session is: its backend, its settings and what it is charged to.
- `code://docs/sdk/TERMINALS.md` - terminals: where one runs, who opens one and its grants.
- `code://docs/sdk/TOOLS.md` - what tools a session's model is offered.
- `code://docs/sdk/USAGE.md` - the records this host writes and what a pool has been charged.
- `code://docs/sdk/USERS.md` - the user directory: the people, their roles and what their work may be charged to.
- `code://README.md` - what the repository is and how to start it.
- `code://REFERENCE.md` - where the reference lives, how the clone is made, and the revisions last read.
- `code://UPSTREAM.md` - the running list, one section per pass, a box per item.

## Runtime path

Nothing runs. A pass reads the reference, writes its review under `.project/review/`, and the documents that describe the changed behaviour move with the code in the same commit.

`pnpm docs:dev` serves the site while you edit it, `pnpm docs:build` writes it to `docs/.vitepress/dist`, and `pnpm docs:preview` serves that build.
The build fails on a dead link and on a page that is not in the sidebar.
A push to `main` that changes `docs/` or a package README runs `deploy-docs.yml`, which builds the site and deploys it to `https://softov.github.io/ahpd/`.

## Tests

- There is no test. The documents are checked by reading them against the code, which is what produced the six findings recorded in the pass at [the pass 4 review](../../review/2026-09-19-upstream-pass-4.md).

## Known gaps

- Six places where the prose contradicts the code, each verified and none of them caused by an upstream change; plan [01 - Correct the stale prose](01-correct-the-stale-prose/plan.md).
