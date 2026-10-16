---
title: The docs live in server, sdk and plugins folders
status: done
depends: []
layer: "docs"
refs:
  - "[code://docs/README.md](../../../../docs/README.md) - the index, which lists the files by folder after the move"
  - "[code://packages/bot/test/bot-docs.test.ts#L16](../../../../packages/bot/test/bot-docs.test.ts#L16) - reads `docs/plugins/BOTS.md`, which was `docs/BOTS.md` before the move"
  - "[code://README.md](../../../../README.md) - the table of area files, and the links to DAEMON, PLUGINS and AHP"
---

## Objective

Every area file is in `docs/server/`, `docs/sdk/` or `docs/plugins/`, and every path to it in the repository names the new place.
`docs/plugins/` has one page for each of the 9 plugin packages, and each page includes its package README.
`CHANGELOG.md` keeps the paths it records.

## Files

- `UPDATE: docs/AHP.md` - moves to `docs/sdk/AHP.md`.
- `UPDATE: docs/AGENT.md` - moves to `docs/sdk/AGENT.md`.
- `UPDATE: docs/LIBRARY.md` - moves to `docs/sdk/LIBRARY.md`.
- `UPDATE: docs/HOST.md` - moves to `docs/sdk/HOST.md`.
- `UPDATE: docs/SESSIONS.md` - moves to `docs/sdk/SESSIONS.md`.
- `UPDATE: docs/CHATS.md` - moves to `docs/sdk/CHATS.md`.
- `UPDATE: docs/RESOURCES.md` - moves to `docs/sdk/RESOURCES.md`.
- `UPDATE: docs/TOOLS.md` - moves to `docs/sdk/TOOLS.md`.
- `UPDATE: docs/TERMINALS.md` - moves to `docs/sdk/TERMINALS.md`.
- `UPDATE: docs/AUTOMATIONS.md` - moves to `docs/sdk/AUTOMATIONS.md`.
- `UPDATE: docs/POLICY.md` - moves to `docs/sdk/POLICY.md`.
- `UPDATE: docs/USAGE.md` - moves to `docs/sdk/USAGE.md`; its `ahpd usage` command text moves to `docs/server/USAGE.md`, and a line links there.
- `UPDATE: docs/USERS.md` - moves to `docs/sdk/USERS.md`; its `users` key, `--users` flag and `ahpd user` command text moves to `docs/server/USERS.md`, and a line links there.
- `UPDATE: docs/AUTHENTICATION.md` - moves to `docs/sdk/AUTHENTICATION.md`; its `ahpd user` command text moves to `docs/server/USERS.md`, and a line links there.
- `UPDATE: docs/DAEMON.md` - moves to `docs/server/REFERENCE.md`.
- `UPDATE: docs/PROXY.md` - moves to `docs/server/PROXY.md`.
- `CREATE: docs/server/USERS.md` - a heading, a line that links to `docs/sdk/USERS.md`, and the `users` key, the `--users` flag and the `ahpd user` commands, from `docs/sdk/USERS.md`.
- `CREATE: docs/server/USERS.md` - a heading, a line that links to `docs/sdk/AUTHENTICATION.md`, and the `ahpd user` commands, from `docs/sdk/AUTHENTICATION.md`.
- `CREATE: docs/server/USAGE.md` - a heading, a line that links to `docs/sdk/USAGE.md`, and the `ahpd usage` commands, from `docs/sdk/USAGE.md`.
- `UPDATE: docs/PLUGINS.md` - moves to `docs/plugins/PLUGINS.md`.
- `UPDATE: docs/BOTS.md` - moves to `docs/plugins/BOTS.md`.
- `UPDATE: docs/COMPUTER.md` - moves to `docs/plugins/COMPUTERS.md`.
- `UPDATE: docs/CONTAINERS.md` - moves to `docs/plugins/CONTAINERS.md`.
- `UPDATE: docs/WEBHOOKS.md` - moves to `docs/plugins/WEBHOOKS.md`.
- `CREATE: docs/plugins/agent-acp.md` - a heading and an include of `packages/agent-acp/README.md`.
- `CREATE: docs/plugins/agent-claude.md` - a heading and an include of `packages/agent-claude/README.md`.
- `CREATE: docs/plugins/agent-cofold.md` - a heading and an include of `packages/agent-cofold/README.md`.
- `CREATE: docs/plugins/agent-pi.md` - a heading and an include of `packages/agent-pi/README.md`.
- `CREATE: docs/plugins/bot.md` - a heading, an include of `packages/bot/README.md` and a link to `BOTS.md`.
- `CREATE: docs/plugins/computer.md` - a heading, an include of `packages/computer/README.md` and a link to `COMPUTERS.md`.
- `CREATE: docs/plugins/push.md` - a heading and an include of `packages/push/README.md`.
- `CREATE: docs/plugins/tunnel-devtunnel.md` - a heading and an include of `packages/tunnel-devtunnel/README.md`.
- `CREATE: docs/plugins/webhook.md` - a heading, an include of `packages/webhook/README.md` and a link to `WEBHOOKS.md`.
- `UPDATE: docs/README.md` - lists the files in three tables, one per folder, with the plugin pages in `plugins/`.
- `UPDATE: packages/bot/test/bot-docs.test.ts:16` - reads `docs/plugins/BOTS.md`.
- `UPDATE: packages/sdk/src/users.ts` - the `resource_documentation` link names `docs/sdk/USERS.md`.
- `UPDATE: README.md` - the links to area files name the new paths.
- `UPDATE: DEVELOPER.md` - the link to `AHP.md` names the new path.
- `UPDATE: REFERENCE.md` - the link to `AHP.md` names the new path.
- `UPDATE: .project/plans/documentation/00-documentation.md` - the Contracts list names the new paths and the three folders.

## Steps

1. Move each area file with `git mv` to the folder that the plan's *Answers* table names.
2. Commit the moves alone, so `git log --follow` keeps each file's history.
3. In the moved files, rewrite a link to a file in the same folder as the bare file name.
4. In the moved files, rewrite a link to a file in another folder as `../<folder>/<NAME>.md`.
5. In the moved files, add one `../` to each link that leaves `docs/`.
6. Rewrite each `docs/<NAME>.md` path outside `docs/` to `docs/<folder>/<NAME>.md`, with a script.
7. Run the script on code, tests, READMEs, the root Markdown files and `.project/`.
8. Do not let the script change `CHANGELOG.md` or anything under `node_modules/`.
9. Keep an anchor after a path, such as `#--plugin-and-what-naming-one-runs`, as it is.
10. Write each plugin page as a `#` heading and `<!--@include: ../../packages/<package>/README.md-->`.
11. Include each README from the line after its `#` heading, so the page has one heading.
12. Rewrite `docs/README.md` as three tables, one per folder, in the order of the *Answers* table.
13. Update `00-documentation.md` with the new paths and one line on each folder.
14. Commit the path rewrite and the new pages as the second commit.

## Validation

- For each moved file, `rg -n 'docs/<NAME>\.md' --glob '!CHANGELOG.md' --glob '!node_modules'` finds only the new path.
- `rg -n '\]\((\.\./)*[A-Z]+\.md' docs` finds no link to a file that is not in that folder.
- `pnpm test:unit` passes, `bot-docs.test.ts` included.
- `pnpm typecheck` passes.
- `git log --follow docs/server/REFERENCE.md` shows the history from before the move.
- Open `docs/README.md` and one moved file on GitHub after the push, and follow three links in each.

## Resume

### Built

- 21 area files moved with `git mv`: 14 to `docs/sdk/`, `DAEMON.md` and `PROXY.md` to `docs/server/`, and five to `docs/plugins/`.
- `docs/COMPUTER.md` moved to `docs/plugins/COMPUTERS.md`, because VitePress keys pages without case and `computer.md` is the package page.
- `docs/server/USERS.md`, `AUTHENTICATION.md` and `USAGE.md` hold the CLI sections from the `sdk/` pages of the same name, moved as written.
- Each `sdk/` page keeps the heading of the moved section, with one line that links to the `server/` page, and each `server/` page links back.
- `docs/server/USERS.md` holds the whole "Turning it on" section.
- Nine plugin pages include their package README from the line after its heading.
- `bot.md`, `computer.md` and `webhook.md` end with a link to `BOTS.md`, `COMPUTERS.md` and `WEBHOOKS.md`.
- `docs/README.md` has one table per folder, in the order of the sidebar.
- A script rewrote each old path in code, tests, READMEs, the root Markdown files and `.project/`, but not in `CHANGELOG.md`.
- The script keeps the `ahp-git:` and `file://${dir}` fixtures in `changes-uris.test.ts`, because they name a file in a temporary repository.
- `00-documentation.md` names the three folders and the new pages.

### Validation

- A search for each old path finds `CHANGELOG.md`, the fixtures in `changes-uris.test.ts` and this plan.
- This plan names the old paths on purpose.
- A link check covers `docs/`, the root Markdown files and each README.
- It finds five bad links, and each of them was bad before the move.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- Vitest on `packages/bot`, the `users` and `wire` tests in `packages/sdk` and `computer-disposable` passes: 19 files, 337 tests.
- The coordinator commits the tree, so `git log --follow` and the GitHub check wait for those commits.

### Seen and not done

- Steps 2 and 14 say to commit in two steps, and the coordinator commits the tree instead.
- `docs/sdk/CHATS.md` and `docs/sdk/SESSIONS.md` link to the anchors `#chat--29-of-30` and `#session--28-of-28`, which `AHP.md` no longer has.
- `REFERENCE.md` links to `src/git.ts` and `src/changes.ts`, which do not exist.
- The rewrite script finds a path that starts with `docs/`, so a relative link inside `docs/` needs a separate fix after a move.
