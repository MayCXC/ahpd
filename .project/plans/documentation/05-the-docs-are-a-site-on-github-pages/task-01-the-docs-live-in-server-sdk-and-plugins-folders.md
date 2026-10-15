---
title: The docs live in server, sdk and plugins folders
status: todo
depends: []
layer: "docs"
refs:
  - "[code://docs/README.md](../../../../docs/README.md) - the index, which lists the files by folder after the move"
  - "[code://packages/bot/test/bot-docs.test.ts#L16](../../../../packages/bot/test/bot-docs.test.ts#L16) - reads `docs/BOTS.md`, which becomes `docs/plugins/BOTS.md`"
  - "[code://README.md](../../../../README.md) - the table of area files, and the links to DAEMON, PLUGINS and AHP"
---

## Objective

Every area file is in `docs/server/`, `docs/sdk/` or `docs/plugins/`, and every path to it in the repository names the new place.
`docs/plugins/` has one page for each of the 9 plugin packages, and each page includes its package README.
`CHANGELOG.md` keeps the paths it records.

## Files

- `UPDATE: docs/AHP.md` - moves to `docs/server/AHP.md`.
- `UPDATE: docs/AUTHENTICATION.md` - moves to `docs/server/AUTHENTICATION.md`.
- `UPDATE: docs/AUTOMATIONS.md` - moves to `docs/server/AUTOMATIONS.md`.
- `UPDATE: docs/CHATS.md` - moves to `docs/server/CHATS.md`.
- `UPDATE: docs/CONTAINERS.md` - moves to `docs/server/CONTAINERS.md`.
- `UPDATE: docs/DAEMON.md` - moves to `docs/server/DAEMON.md`.
- `UPDATE: docs/HOST.md` - moves to `docs/server/HOST.md`.
- `UPDATE: docs/POLICY.md` - moves to `docs/server/POLICY.md`.
- `UPDATE: docs/PROXY.md` - moves to `docs/server/PROXY.md`.
- `UPDATE: docs/RESOURCES.md` - moves to `docs/server/RESOURCES.md`.
- `UPDATE: docs/SESSIONS.md` - moves to `docs/server/SESSIONS.md`.
- `UPDATE: docs/TERMINALS.md` - moves to `docs/server/TERMINALS.md`.
- `UPDATE: docs/TOOLS.md` - moves to `docs/server/TOOLS.md`.
- `UPDATE: docs/USAGE.md` - moves to `docs/server/USAGE.md`.
- `UPDATE: docs/USERS.md` - moves to `docs/server/USERS.md`.
- `UPDATE: docs/AGENT.md` - moves to `docs/sdk/AGENT.md`.
- `UPDATE: docs/LIBRARY.md` - moves to `docs/sdk/LIBRARY.md`.
- `UPDATE: docs/PLUGINS.md` - moves to `docs/plugins/PLUGINS.md`.
- `UPDATE: docs/BOTS.md` - moves to `docs/plugins/BOTS.md`.
- `UPDATE: docs/COMPUTER.md` - moves to `docs/plugins/COMPUTER.md`.
- `UPDATE: docs/WEBHOOKS.md` - moves to `docs/plugins/WEBHOOKS.md`.
- `CREATE: docs/plugins/agent-acp.md` - a heading and an include of `packages/agent-acp/README.md`.
- `CREATE: docs/plugins/agent-claude.md` - a heading and an include of `packages/agent-claude/README.md`.
- `CREATE: docs/plugins/agent-cofold.md` - a heading and an include of `packages/agent-cofold/README.md`.
- `CREATE: docs/plugins/agent-pi.md` - a heading and an include of `packages/agent-pi/README.md`.
- `CREATE: docs/plugins/bot.md` - a heading, an include of `packages/bot/README.md` and a link to `BOTS.md`.
- `CREATE: docs/plugins/computer.md` - a heading, an include of `packages/computer/README.md` and a link to `COMPUTER.md`.
- `CREATE: docs/plugins/push.md` - a heading and an include of `packages/push/README.md`.
- `CREATE: docs/plugins/tunnel-devtunnel.md` - a heading and an include of `packages/tunnel-devtunnel/README.md`.
- `CREATE: docs/plugins/webhook.md` - a heading, an include of `packages/webhook/README.md` and a link to `WEBHOOKS.md`.
- `UPDATE: docs/README.md` - lists the files in three tables, one per folder, with the plugin pages in `plugins/`.
- `UPDATE: packages/bot/test/bot-docs.test.ts:16` - reads `docs/plugins/BOTS.md`.
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
- `git log --follow docs/server/DAEMON.md` shows the history from before the move.
- Open `docs/README.md` and one moved file on GitHub after the push, and follow three links in each.

## Resume
