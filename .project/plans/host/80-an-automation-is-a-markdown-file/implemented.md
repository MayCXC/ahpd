---
title: The automation store moves to the server, and an automation is a Markdown file - implemented
date: 2026-10-11
refs:
  - git://4e3756e - the last commit of the build, released in 0.11.0
  - "[code://packages/server/src/scheduled.ts](../../../../packages/server/src/scheduled.ts) - `scheduledAutomations` and `migrateAutomations`"
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts) - `daemonAutomations`, which converts and then opens the store"
  - "[code://packages/server/src/records.ts#L26](../../../../packages/server/src/records.ts#L26) - `RESERVED_COLLECTIONS`, which now names `automations`"
---

An automation is a Markdown file in `<configDir>/automations/<id>.md`, with its message as the body.
Its run state is kept apart, in `automations-state.json`.
`automations.json` is converted when the daemon starts, and the original is kept as `automations.json.migrated`.
A person can edit or copy a file, and the daemon reloads it and arms the clock again.

## What was built

- [`code://packages/server/src/scheduled.ts`](../../../../packages/server/src/scheduled.ts) - the store, moved from the sdk, over a folder and a state file. It writes with `recordFile`, reads with `readRecordFile` and watches the folder. An id is lowercase letters, digits and hyphens, starts with a letter or a digit, and has at most 64 characters.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - `daemonAutomations` runs `migrateAutomations` and then opens the store.
- [`code://packages/server/src/records.ts`](../../../../packages/server/src/records.ts) - a plugin cannot open a collection named `automations`.
- `docs/AUTOMATIONS.md`, `docs/DAEMON.md`, `docs/LIBRARY.md` and `docs/PLUGINS.md` describe the file and the folder.

## Verified

- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- `pnpm exec vitest run packages/sdk packages/server packages/bot` passes 3758 tests in 193 files, on main with plugin 45 p2.
- A copy of `~/.config/ahpd/automations.json` converted all three automations, and the UUID one too.
- After the restart on 2026-10-11, the three real automations converted and show in the clients.

## Departures from the plan

- Task 06 was added in review. ahpc names a new automation with a UUID, and the slug rule refused it. Automation ids now have their own rule, which Softov chose on 2026-10-11.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the tests, and is left as main has it.

## Left for later

- none.
