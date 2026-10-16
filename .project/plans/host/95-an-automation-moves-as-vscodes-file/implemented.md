---
title: An automation moves as VS Code's file - implemented
date: 2026-10-16
refs:
  - git://547ed2e2
  - "[code://packages/server/src/commands/automation.ts](../../../../packages/server/src/commands/automation.ts)"
  - "[code://packages/server/src/blueprint.ts](../../../../packages/server/src/blueprint.ts)"
  - "[code://packages/server/src/scheduled.ts](../../../../packages/server/src/scheduled.ts)"
---

`ahpd automation list` shows the automations of a host. `ahpd automation export` writes one as ahpd's own `.automation.md` file, and `import` makes a new automation from that file. With `--vscode`, export and import use VS Code's file, so an automation moves between VS Code and ahpd.

## What was built

- [`code://packages/server/src/commands/automation.ts`](../../../../packages/server/src/commands/automation.ts) - `automation list`, `export` and `import`, on the CLI and on HTTP.
- [`code://packages/server/src/blueprint.ts`](../../../../packages/server/src/blueprint.ts) - VS Code's file format, read and written with VS Code's rules.
- [`code://packages/server/src/scheduled.ts`](../../../../packages/server/src/scheduled.ts) - `automationFile` and `readAutomationFile`, the store's file format that export and import share.
- [`code://docs/sdk/AUTOMATIONS.md`](../../../../docs/sdk/AUTOMATIONS.md) - both files, and the refusals of VS Code's file.

## Verified

- `packages/server/test/blueprint.test.ts` and `server-commands.test.ts`. The full vitest run had 289 files and 5170 tests, and all passed.
- CI and Docs passed on `cf12ba35`.
- By hand, 2026-10-16: Softov imported an ahpd file in VS Code, and a VS Code file in ahpd.

## Departures from the plan

- Task 05 - export and import drop `_meta.ahpd.pinnedSession`, because the pinned chat is on the source host.
- Task 05 - without `--folder`, import checks every folder that the file names, not only the first.

## Left for later

- None.
