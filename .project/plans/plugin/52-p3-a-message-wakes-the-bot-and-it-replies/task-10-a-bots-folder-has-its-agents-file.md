---
title: A bot's folder has its AGENTS.md
status: todo
depends: [task-03-a-message-wakes-a-back-session.md]
layer: "packages/bot"
refs:
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - the make road, where `workspaceFor` gives the folder"
  - "[code://packages/bot/src/wake.ts](../../../../packages/bot/src/wake.ts) - `sessionFor`, the back session's request"
  - "[code://packages/agent-claude/src/session/query.ts#L320](../../../../packages/agent-claude/src/session/query.ts#L320) - Claude loads `CLAUDE.md` only from a trusted folder"
---

## Objective

A bot's folder holds `AGENTS.md`, which is the bot's rules, and a `CLAUDE.md` that holds `@AGENTS.md`.
Each harness reads `AGENTS.md` itself, and the bot rewrites it when it needs to.
The record's `instructions` field is only the seed of the first `AGENTS.md`.
The plugin never writes over a file that is in the folder.

## Files

- `CREATE: packages/bot/src/folder.ts` - write `AGENTS.md` and `CLAUDE.md` when they are absent.
- `UPDATE: packages/bot/src/wake.ts` - prepare the folder and mark it trusted before a back session starts.
- `CREATE: packages/bot/test/bot-folder.test.ts` - the tests of the folder.

## Steps

1. Before a back session starts, create the bot's folder when it is absent.
2. Write `CLAUDE.md` with the line `@AGENTS.md` when the file is absent.
3. Write `AGENTS.md` from the record's `instructions` when the file is absent and the record has `instructions`.
4. Leave `AGENTS.md` absent when the record has no `instructions`, because task 11 writes it.
5. Never write over a file that is there.
6. Find how a session the plugin starts gets `trusted` for its folder.
7. Make the bot's own folder trusted for its back sessions, and no other folder.
8. Stop and report when no seam gives a plugin's session a trusted folder.

## Validation

- `bot-folder.test.ts`: test that an empty folder gets `CLAUDE.md` and an `AGENTS.md` from `instructions`.
- `bot-folder.test.ts`: test that a file a person wrote stays as it is.
- `bot-folder.test.ts`: test that a bot with no `instructions` gets `CLAUDE.md` and no `AGENTS.md`.
- The gates pass: build, typecheck, boundary, schema and vitest.
