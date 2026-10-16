---
title: The docs build as a VitePress site
status: done
depends:
  - task-01-docs-live-in-server-sdk-plugins-folders.md
layer: "docs"
refs:
  - "[code://docs/README.md](../../../../docs/README.md) - the order of the files in each folder, which the sidebar groups follow"
  - "[code://package.json](../../../../package.json) - the scripts and the dev dependency"
  - npm://vitepress@^1.6.4 - the generator
  - https://github.com/microsoft/agent-host-protocol/blob/main/docs/.vitepress/config.mts - the config shape to copy
---

## Objective

`pnpm docs:build` turns `docs/` into a static site with a theme toggle, local search, a home page and a sidebar of every page.
The sidebar has one group per folder, and every link on a page works on the site, links in an included README too.

## Files

- `CREATE: docs/.vitepress/config.mts` - title, `base` from `DOCS_BASE`, `cleanUrls`, nav, sidebar, local search, edit link, the link rewrite and the sidebar check.
- `CREATE: docs/.vitepress/theme/index.ts` - extends the default theme and imports `custom.css`.
- `CREATE: docs/.vitepress/theme/custom.css` - the ahpw palette for the light theme and the dark theme.
- `CREATE: docs/index.md` - the home page, with `layout: home`, a hero and one feature per folder.
- `UPDATE: package.json` - adds `docs:dev`, `docs:build` and `docs:preview`, and `vitepress` under `devDependencies`.
- `UPDATE: pnpm-lock.yaml` - the lock for `vitepress`.
- `UPDATE: .gitignore` - adds `docs/.vitepress/dist` and `docs/.vitepress/cache`.
- `UPDATE: .project/plans/documentation/00-documentation.md` - names the site, the config and the commands under Contracts and Runtime path.

## Steps

1. Add `vitepress@^1.6.4` to the root `devDependencies` with `pnpm add -D -w vitepress`.
2. Add the scripts `docs:dev`, `docs:build` and `docs:preview`, each as `vitepress <verb> docs`.
3. Write `config.mts` with `title: 'ahpd'` and the `description` from `package.json`.
4. Set `base` to `process.env.DOCS_BASE ?? '/ahpd/'`.
5. Set `cleanUrls: true` and `lastUpdated: true`.
6. Set `themeConfig.search` to `{ provider: 'local' }`.
7. Set the nav to the home page, "All documents" at `/README`, and GitHub at `https://github.com/softov/ahpd`.
8. Write the sidebar as three groups: "Server", "SDK" and "Plugins", one per folder.
9. Order each group as `docs/README.md` orders that folder.
10. In "Plugins", put PLUGINS first, then each plugin page, with BOTS, COMPUTERS and WEBHOOKS after their plugin's page.
11. Throw at config load when a `docs/**/*.md` file other than `README.md` and `index.md` is not in the sidebar.
12. Add a markdown-it rule in `markdown.config` that rewrites a relative link which leaves `docs/`.
13. Make the rewritten link `https://github.com/softov/ahpd/blob/main/<path>`, or `tree/main/<path>` for a folder.
14. Resolve a relative link in an included README against that README's folder, not against the page.
15. Set `editLink.pattern` to `https://github.com/softov/ahpd/edit/main/docs/:path`.
16. Write `theme/index.ts` that extends `vitepress/theme` and imports `custom.css`.
17. Set `--vp-c-brand-1` to `--vp-c-brand-3` in `custom.css`, for `:root` and for `.dark`.
18. Write `docs/index.md` with the hero, the actions "Get started" and "All documents", and three features.
19. Add the two build folders to `.gitignore`.
20. Update `00-documentation.md` to name the site, `docs/.vitepress/` and the three scripts.

## Validation

- `pnpm docs:build` exits 0, and its output has no dead-link warning.
- `DOCS_BASE=/ pnpm docs:build` exits 0, and `docs/.vitepress/dist/index.html` links to `/server/DAEMON`, not `/ahpd/server/DAEMON`.
- Take `docs/plugins/WEBHOOKS.md` out of the sidebar for a moment, and `pnpm docs:build` fails and names the file.
- In `pnpm docs:preview`, the theme toggle changes the theme, and a search for `refusal` finds `sdk/POLICY`.
- In the preview, the link to `packages/sdk/src/types/agent.ts` in `sdk/AGENT` opens the file on GitHub.
- In the preview, `plugins/agent-claude` shows the package README with one heading, and its links work.
- `git diff --stat -- docs/**/*.md packages/*/README.md` shows no change to a page or to a package README.
- Check the home page and one area page at 1280 and at 390 pixels wide.

## Resume

### Built

- `docs/.vitepress/config.mts` has the title, the description from `package.json`, `base` from `DOCS_BASE`, `cleanUrls`, `lastUpdated`, the nav, the local search and the edit link.
- The sidebar has the groups "Server", "SDK" and "Plugins", and the config load throws when a page is not in it.
- A markdown-it rule turns a relative link that leaves `docs/` into a link to the file on GitHub at `main`.
- A Vite plugin marks each `@include` with the folder of the included file, so the rule resolves a link in a README against that folder.
- The config adds `v-pre` to inline code, because Vue reads `{{ }}` in a page as an expression.
- The config shows an unknown inline HTML tag as text.
- Vue reads `<domain>` in `PLUGINS.md` as an element with no end tag, and the build fails without this.
- `custom.css` sets the ahpw palette: the slate and the teal `#4ec9b0` in the dark theme, and `#0c7061` in the light theme. It also shows the badges of a README in one line.
- `docs/index.md` has the hero, the tagline from `package.json`, the actions "Get started" and "All documents", and one feature per folder.
- `package.json` has `docs:dev`, `docs:build` and `docs:preview`, and `vitepress@^1.6.4` under `devDependencies`.
- `.gitignore` ignores `docs/.vitepress/dist` and `docs/.vitepress/cache`.
- `00-documentation.md` names the site, `docs/.vitepress/` and the three scripts.

### Validation

- `pnpm docs:build` exits 0 with no dead-link warning.
- `DOCS_BASE=/ pnpm docs:build` exits 0, and `index.html` links to `/server/DAEMON`.
- With `WEBHOOKS` out of the sidebar, the build fails with `not in the sidebar: docs/plugins/WEBHOOKS.md`.
- In the preview, a headless browser changes the theme with the toggle, and a search for `refusal` finds `sdk/POLICY`.
- In `sdk/AGENT`, the link to `packages/sdk/src/types/agent.ts` goes to the file on GitHub.
- `plugins/agent-claude` has one `h1`, and each of its links works.
- The home page, `sdk/POLICY` and `plugins/agent-claude` have no horizontal scroll at 1280 and at 390 pixels wide.
- This task changes no page in `docs/` and no package README.

### Seen and not done

- A package README links to a page with an absolute GitHub URL, so that link opens GitHub and not the site page.
- The build warns that one chunk is larger than 500 kB, which is the local search index.
