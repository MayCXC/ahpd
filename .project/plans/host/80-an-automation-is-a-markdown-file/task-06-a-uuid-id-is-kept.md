---
title: A UUID id is kept, and the automation folder is reserved
status: implemented
depends: [task-05-the-docs-describe-the-file.md]
layer: "server"
refs:
  - "[code://packages/server/src/scheduled.ts#L144-L148](../../../../packages/server/src/scheduled.ts#L144-L148) - `idOf`, which takes the bot slug rule today"
  - "[code://packages/server/src/records.ts#L26](../../../../packages/server/src/records.ts#L26) - `RESERVED_COLLECTIONS`"
  - file:///github/ahpc/src/ahp/live.ts - ahpc names a new automation with a UUID, at line 2406
---

## Objective

An automation that a client names with a UUID is kept as a file, and a plugin cannot open the automation folder as a collection.

## Files

- `UPDATE: packages/server/src/scheduled.ts` - an automation id rule of its own, used by `idOf`, `idsIn`, the watch and the refusal text.
- `UPDATE: packages/server/src/records.ts:26` - add `automations` to `RESERVED_COLLECTIONS`.
- `UPDATE: packages/server/test/automation-files.test.ts` - a UUID row converts, and a UUID automation is created, saved and read back.
- `UPDATE: packages/server/test/records.test.ts` - a plugin that opens `automations` is refused, and `bots` still opens.
- `UPDATE: docs/AUTOMATIONS.md` - the rule for the file name.
- `UPDATE: docs/PLUGINS.md` - the sentence naming the collections the store refuses, which `automations` is now one of.

## Steps

1. Define the automation id rule in `scheduled.ts`: `^[a-z0-9][a-z0-9-]{0,63}$`, with a text for the refusal.
2. Use that rule wherever `scheduled.ts` uses `isRecordSlug` or `RECORD_SLUG` today.
3. Change the case `leaves behind a row whose id could not name a file` so that a UUID row converts.
4. Keep a conversion case that leaves a row behind, for an id with an upper-case letter.
5. Add a case that creates, saves, reloads and lists an automation named `ahp-automation:/<uuid>`.
6. Add `automations` to `RESERVED_COLLECTIONS`, and add a case for it in the records tests.
7. Write the file name rule in the automation file section of `docs/AUTOMATIONS.md`.

## Validation

- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- `pnpm exec vitest run packages/sdk packages/server --maxWorkers=2 --testTimeout=10000` passes.
- `rg -n "isRecordSlug|RECORD_SLUG" packages/server/src/scheduled.ts` finds nothing.

## Resume

Implemented 2026-10-11. `packages/server/src/scheduled.ts` has the rule of its own, beside the other answers about the two files: `AUTOMATION_ID` is the text of it, `lowercase letters, digits and dashes, one to sixty-four of them, starting with a letter or a digit`, and `isAutomationId` is `/^[a-z0-9][a-z0-9-]{0,63}$/`. The four places that asked the record store's slug now ask this one: `idOf`, which decides whether a resource names a file, `idsIn`, which reads the folder, the watch's filter on an event's file name, and `idFor`'s refusal. `isRecordSlug` and `RECORD_SLUG` are no longer imported from `@ahpd/sdk` at all. What the rule cost is what it bought: an automation a client named with a UUID is a file named after it, and a person writing one by hand may name it the same way.

`RESERVED_COLLECTIONS` in `packages/server/src/records.ts` names `automations` now, so a plugin that opens that collection is refused rather than sharing the daemon's automation folder. `bots` is deliberately left out, with a comment saying why: that folder is the bot plugin's, and the plugin opens it through this store - which is also why a bot's id is still a record slug and an automation's no longer has to be.

Files changed, uncommitted:

- `UPDATE: packages/server/src/scheduled.ts` - `AUTOMATION_ID` and `isAutomationId`, and the four uses.
- `UPDATE: packages/server/src/records.ts` - `automations` in `RESERVED_COLLECTIONS`, and the comment about `bots`.
- `UPDATE: packages/server/test/automation-files.test.ts` - the refusal case adds a sixty-five character id; a new case keeps an automation a client named with a UUID, written, listed and read back; the conversion case is now two, `gives a row a UUID names a file of its own` and `leaves behind a row whose id could not name a file`, the latter with an upper-case id.
- `UPDATE: packages/server/test/records.test.ts` - `automations` is refused as a collection and `bots` still opens.
- `UPDATE: docs/AUTOMATIONS.md` - the sentence giving the file name rule.
- `UPDATE: docs/PLUGINS.md` - the list of collections the store refuses, which said `sessions`, `usage`, `agentPlugins` or `node_modules`.
- `CREATE: .project/plans/host/80-an-automation-is-a-markdown-file/task-06-a-uuid-id-is-kept.md` - this task, written by Softov before the build and still untracked in git, so a commit per task has to add it.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server --maxWorkers=2 --testTimeout=10000` pass - 188 files, 3680 cases.

`packages/sdk/test/fixtures/wire.jsonl` was clean in git when this task started, and the suite rewrote it again: 33 lines, the endpoint lines it always rewrites. Left as it is in the worktree because every restore command is denied here - `git checkout -- packages/sdk/test/fixtures/wire.jsonl` takes it back.
