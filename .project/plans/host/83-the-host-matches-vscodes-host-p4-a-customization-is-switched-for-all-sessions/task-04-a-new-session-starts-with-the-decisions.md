---
title: A new session starts with the global and folder decisions
status: todo
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
- `UPDATE: docs/AHP.md:220` - say that the global and folder entries are kept and reach every session.

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
