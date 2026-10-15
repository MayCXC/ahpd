---
title: The docs are a site on GitHub Pages, in server, sdk and plugins folders - implemented
date: 2026-10-15
refs:
  - git://7c9355a3
  - "[code://docs/.vitepress/config.mts](../../../../docs/.vitepress/config.mts)"
  - "[code://.github/workflows/deploy-docs.yml](../../../../.github/workflows/deploy-docs.yml)"
  - "[code://docs/server/REFERENCE.md](../../../../docs/server/REFERENCE.md)"
---

The docs are a VitePress site, built from `docs/server/`, `docs/sdk/` and `docs/plugins/`, and a push to `main` publishes it to GitHub Pages.

## What was built

- `docs/sdk/` - the 14 pages for a person who builds a host with `@ahpd/sdk`.
- `docs/plugins/` - the plugin guide, BOTS, COMPUTERS, CONTAINERS, WEBHOOKS, and one page per plugin that includes its package README.
- `docs/server/` - the pages for a person who runs the daemon: GET-STARTED, INSTALL, RUN, CONFIGURE, PLUGINS, CONNECT, REMOTE, USERS, VAULT, USAGE, PROXY and REFERENCE.
- [`code://docs/server/REFERENCE.md`](../../../../docs/server/REFERENCE.md) - the command reference, generated from the CLI declarations when the site builds.
- [`code://docs/.vitepress/config.mts`](../../../../docs/.vitepress/config.mts) - the nav, the sidebar, the local search, the link rewrite to GitHub, and the ahpw palette.
- [`code://.github/workflows/deploy-docs.yml`](../../../../.github/workflows/deploy-docs.yml) - builds the packages and the site, and deploys it to Pages.
- The nine plugin READMEs have one shape: Install, Options, In your own host, then the plugin's own sections.
  A plugin that needs something outside ahpd also has What it needs.

## Verified

- `pnpm docs:build` passes.
- The link check reads 425 links and finds the 5 bad links that were on `main` before this plan.
- Softov read the site on the dev server and approved it on 2026-10-15.
- No path to an old `docs/<NAME>.md` location is left outside `CHANGELOG.md`.

## Departures from the plan

- `docs/server/DAEMON.md` and `docs/server/AUTHENTICATION.md` were rewritten as task-first pages, and the two files are deleted. Each ref to them in `.project/` now names `docs/server/REFERENCE.md` or `docs/server/USERS.md`, without a line anchor.
- The server pages are short and task-first, at Softov's request. The command and flag reference is generated, and the internals moved to `DEVELOPER.md`.

## Left for later

- The Pages source is a repository setting. Softov sets it to GitHub Actions before the first deploy.
- `packages/bot/README.md` does not describe the `lastChats` option.
