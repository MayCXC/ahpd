---
title: The store reloads a file a person edits
status: done
depends: [task-02-the-store-keeps-markdown-files.md]
layer: "packages/server"
refs:
  - "[code://packages/sdk/src/scheduled.ts](../../../../packages/sdk/src/scheduled.ts) - `scheduledAutomations`, which arms the clock and tells the catalogue, in the server after task 01"
  - "[code://packages/sdk/src/resources/resources.ts#L503](../../../../packages/sdk/src/resources/resources.ts#L503) - the file store's `watch`"
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

Implemented 2026-10-11, all in `scheduledAutomations`. The store makes the folder at open (`mkdirSync`, mode `0700`) and watches it with `node:fs.watch`, which is what a daemon that has never been handed an automation needs to notice the first file somebody drops in. An event naming an `<id>.md` whose id is a slug arms a per-id timer of `WINDOW = 50` ms, so the several events of one save are gathered before the file is read once. A file that is gone removes the automation; a file holding what this store last wrote or read (`known`) is this store's own write and is left alone; anything else is read with `readRecordFile` and replaced, added or removed through the inner store, which is what tells the catalogue listeners and re-arms the clock on the path a client's write takes. `close` closes the watch and clears the pending timers.

Two things the definition from a file needed that a client's patch does not. First, the file's definition is passed as the union of the old and new key sets with old-only keys set to `undefined`, because `update` leaves an absent key alone - which is what a patch means, and not what a deleted line means. `textOf` skips `undefined` values so the key is not written back either. Second, the stamp (`createdAt` from the file, `modifiedAt` now) is set *before* the create or update rather than after it, because the change writes the file, and a write that happened first would carry a timestamp this store invented for an automation it had never seen. A file whose definition the host refuses - broken frontmatter, or a definition `checkTriggers`/`checkWake` throws on - is reported as `<file> cannot be read` or `<file> was not loaded`, with the definition and the stamp the store already had left in place.

Files changed, uncommitted:

- `UPDATE: packages/server/src/scheduled.ts` - the folder watch, `reread`, `WINDOW`, the stamp ordering, and `close`.
- `UPDATE: packages/server/test/automation-files.test.ts` - six cases under `a file a person edits while the daemon runs`: a changed schedule moves `nextRunAt` and keeps the rest of the file, a field the file no longer names is taken away, the store hears nothing of its own write, a copied file lists and a removed one goes, broken frontmatter is reported with the old definition kept, and a definition the host will not run is reported with the old one kept.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server --maxWorkers=2 --testTimeout=10000` pass - 188 files, 3677 cases.
