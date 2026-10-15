---
title: A new session starts with the global and folder decisions
status: done
depends: [task-01-a-store-keeps-the-decisions.md, task-03-a-toggle-reaches-every-session.md]
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host.ts#L659-L683](../../../../packages/sdk/src/host.ts#L659-L683) - `dispatch` and `laid`, where a session's customizations are put together"
  - "[code://packages/sdk/src/host/tooling.ts#L276-L300](../../../../packages/sdk/src/host/tooling.ts#L276-L300) - `decisionsOf` and `specificityOf`"
  - "[code://packages/sdk/src/types/session.ts#L351](../../../../packages/sdk/src/types/session.ts#L351) - `customizations()`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/customizationEnablement.ts - the order of the entries, and which entry decides
---

## Objective

Each customization a session reports carries its session, folder and global entries in VS Code's order.
A customization that is off there is switched off when the session starts.

## Files

- `UPDATE: packages/sdk/src/host.ts:659-683` - add the store's entries to each customization in `laid`.
- `UPDATE: packages/sdk/src/host/tooling.ts:276-300` - read the store's entries in `decisionsOf`.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - the cases below, beside the toggle tests.
- `UPDATE: docs/sdk/AHP.md:220` - say that the global and folder entries are kept and reach every session.

## Steps

1. Write a function that gives the entries of one customization in one session.
2. Put the session entry first, the entry of the session's first folder next, and the global entry last.
3. Leave the global entry from the client when the store has none, as VS Code's host does.
4. Add the entries in `laid` to each customization that has a key.
5. Use the same entries in `decisionsOf` for a client plugin.
6. Call `setCustomizationEnabled(id, false)` when a session starts, for each customization that is off.

## Validation

- A session made after a global off reports the customization off, with a `global` entry.
- A session in a folder with a folder off reports a `workspace` entry with that folder's URI.
- A restart with `fileEnablement` keeps a global off.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server` pass.
- Check by hand in VS Code's window: switch a plugin off for all sessions.
- Then start a new session and see the plugin off.

## Resume

- **State:** implemented. All 6 steps are in, and every validation point below passes.
- **What exists now:** `entriesFor` gives the entries of one customization in one session, most specific first.
  The session's own decision comes first, the store's entry for the session's folder next, and the store's global entry last.
  A scope the store holds nothing for keeps the entry the client carried, which is how a client-bundled plugin keeps its default.
  `withEntries` is that read for one customization and its children, keyed the way a toggle looks an id up.
  `laid` in `packages/sdk/src/host.ts` maps the backend's reported half through it, and the subscriber snapshot does the same.
  `decisionsOf` and `partDecisions` read their entries through `entriesFor`, so a client plugin is on or off by the store as well.
  `tellOff(uri, reported)` says `setCustomizationEnabled(id, false)` for each customization a backend reported that the store keeps off.
  `forgetTold(uri)` in `spawn` is what lets a restarted chat be told again, and a per-session `told` set is what says it once.
  `heldInStore` from task 03 is gone: `entriesFor` is the store read now, because one read has to give the session's own entry too.
- **Departures from the Steps:** step 6 is done where the backend reports what it found, not in a session-start path.
  The ids a switch names exist only once the backend has said them, and claude's `create` returns before its CLI answers.
  A call from `openSession` or `spawn` would therefore be dead code for the real backends.
  The place is the `session/customizationsChanged` case in `dispatch`, and `forgetTold` in `spawn` is what a chat starting again is noticed by.
  The `## Files` line names `packages/sdk/src/host.ts:659-683` for `laid` alone; the subscriber snapshot in the same file applies `withEntries` too.
  A subscriber's snapshot is a report as well, so a client that reads a session back has to read the decision the same way.
- **Validation:** a session made after a global off reports the customization off, with a `global` entry.
  A session in a folder with a folder off reports a `workspace` entry naming that folder, and a session in another folder reports nothing.
  A store with no decision leaves the customization with no entries, which every reader takes as on.
  A backend is told which of its own customizations are off, once, on the report that says what it has.
  A host built again over the same store reports the same decision, which is the host half of the plan's restart check.
  The file half of that check is task 02's `packages/server/test/enablement.test.ts`, which reads `fileEnablement` back.
  `pnpm -s typecheck` is clean, `pnpm -s boundary` reports none undeclared, and `pnpm exec vitest run packages/sdk packages/server --maxWorkers=2 --testTimeout=10000` passes, with 190 files and 3698 tests, 5 of them new here.
- **Watch out for:** `tellOff` runs on the backend's reported half alone, before the client's plugins are laid on.
  A client plugin is one no backend has heard of, and asking a backend to switch it would be a refusal said out loud.
  The manual VS Code check in the plan's Validation waits for Softov: a daemon restart and a new session, with the plugin off.
  `withEntries` reads the store at read time, so a decision made after a session started reaches that session's next read.
- **Files changed by this task:**
  - `packages/sdk/src/host.ts` (the `bag` import, the `session/customizationsChanged` case in `dispatch`, `laid`, the subscriber snapshot)
  - `packages/sdk/src/host/tooling.ts` (`entriesFor`, `withEntries`, `told`, `tellOff`, `forgetTold`, `decisionsOf`, `partDecisions`, `enabledOf`, `partOff`, `toggleClientPlugin`, and the three new members of the `Tooling` interface)
  - `packages/sdk/src/host/spawn.ts` (`ctx.forgetTold(uri)`, after the session is recorded)
  - `packages/sdk/test/host-tools.test.ts` (`backendSessions` with four cases, and `reporting` with one)
  - `docs/sdk/AHP.md` (the `session/customizationsChanged` row, line 219)
- **Uncommitted work outside this task:** the run of the sdk and server suites rewrote `packages/sdk/test/fixtures/wire.jsonl` (33 lines, the endpoint line and the `ahpd.` `_meta` lines).
  Every restore command is denied in this preset, so the file waits for Softov: `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
