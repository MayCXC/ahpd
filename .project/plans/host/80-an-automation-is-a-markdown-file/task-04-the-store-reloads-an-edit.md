---
title: The store reloads a file a person edits
status: todo
depends: [task-02-the-store-keeps-markdown-files.md]
layer: "packages/server"
refs:
  - "[code://packages/sdk/src/scheduled.ts](../../../../packages/sdk/src/scheduled.ts) - `scheduledAutomations`, which arms the clock and tells the catalogue, in the server after task 01"
  - "[code://packages/sdk/src/resources.ts#L503](../../../../packages/sdk/src/resources.ts#L503) - the file store's `watch`"
---

## Objective

An added, changed or removed `.md` file in the automation folder changes the store while the daemon runs.
The clock and every subscriber of `ahp-automations://` follow the change.

## Files

- `UPDATE: packages/server/src/scheduled.ts` - a folder watch, and a reload of one file.
- `UPDATE: packages/server/test/automation-files.test.ts` - cases for a hand edit.

## Steps

1. Watch the folder with `node:fs.watch` when the store opens with `dir`.
2. Read again the one file an event names, after a short wait that collects the events of one save.
3. Ignore an event when the file holds what the store wrote last.
4. Replace, add or remove the automation, and arm the clock again.
5. Tell the catalogue listeners, as a write by a client does.
6. Report a definition the host refuses, and keep the old definition.
7. Close the watch when the store closes.

## Validation

- Make sure an edit to a schedule in the file changes `nextRunAt` in the catalogue.
- A file copied into the folder lists as a new automation.
- A removed file removes the automation from the catalogue.
- Make sure the store reports a file with broken frontmatter, and keeps the old definition.
- `pnpm exec vitest run packages/server` passes.

## Resume
