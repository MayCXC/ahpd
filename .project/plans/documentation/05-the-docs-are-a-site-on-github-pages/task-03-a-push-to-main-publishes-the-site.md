---
title: A push to main publishes the site
status: todo
depends:
  - task-02-the-docs-build-as-a-vitepress-site.md
layer: "docs"
refs:
  - "[code://.github/workflows/ci.yml](../../../../.github/workflows/ci.yml) - the pnpm and Node setup to copy"
  - https://github.com/microsoft/agent-host-protocol/blob/main/.github/workflows/deploy.yml - the build and deploy jobs to copy
  - https://vitepress.dev/guide/deploy#github-pages - the Pages source and the artifact path
---

## Objective

A push to `main` that changes `docs/` or a package README builds the site and deploys it to `https://softov.github.io/ahpd/`.
The workflow also runs by hand.

## Files

- `CREATE: .github/workflows/deploy-docs.yml` - a `build` job that uploads `docs/.vitepress/dist`, and a `deploy` job to the `github-pages` environment.
- `UPDATE: .project/plans/documentation/00-documentation.md` - names the workflow and the site address under Runtime path.

## Steps

1. Trigger the workflow on a push to `main` with `paths: ['docs/**', 'packages/*/README.md', '.github/workflows/deploy-docs.yml']`.
2. Add `workflow_dispatch` to the triggers.
3. Set the permissions to `contents: read`, `pages: write` and `id-token: write`.
4. Set `concurrency` to the group `pages` with `cancel-in-progress: false`.
5. In `build`, copy the checkout, `pnpm/action-setup` and `setup-node` steps from `ci.yml`.
6. Set `fetch-depth: 0` on the checkout, so `lastUpdated` reads the real dates.
7. Run `pnpm install --frozen-lockfile`, then `pnpm docs:build`.
8. Upload `docs/.vitepress/dist` with `actions/upload-pages-artifact`.
9. In `deploy`, run `actions/deploy-pages` in the `github-pages` environment, after `build`.
10. Add a comment at the top that says the move to a subdomain sets `DOCS_BASE: /` and adds `docs/public/CNAME`.
11. Update `00-documentation.md` with the workflow and the address.

## Validation

- Run `actionlint .github/workflows/deploy-docs.yml`, and expect no finding.
- Softov sets Settings, Pages, Source to "GitHub Actions" before the first run.
- After the merge, the run on `main` is green and `https://softov.github.io/ahpd/` shows the home page.
- On the live site, a search and the theme toggle work, and `/ahpd/server/SESSIONS` loads directly.

## Resume
