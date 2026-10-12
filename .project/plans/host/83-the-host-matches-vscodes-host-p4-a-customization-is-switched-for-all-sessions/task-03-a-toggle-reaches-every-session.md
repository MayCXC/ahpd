---
title: A toggle records each scope and reaches every session
status: implemented
depends: [task-01-a-store-keeps-the-decisions.md]
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1072-L1123](../../../../packages/sdk/src/host/chatactions.ts#L1072-L1123) - `session/customizationToggled`, which reads the session scope only"
  - "[code://packages/sdk/src/host/tooling.ts#L380-L420](../../../../packages/sdk/src/host/tooling.ts#L380-L420) - `toggleClientPlugin`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostCustomizationEnablementService.ts - a toggle replaces the whole array, and a missing scope is cleared
---

## Objective

`session/customizationToggled` writes the global and folder entries to the store, and keeps the session entry as it does now.
Each session that the change turns on or off is switched and gets its customizations again.

## Files

- `UPDATE: packages/sdk/src/host/chatactions.ts:1072-1123` - record every scope, and rewrite the comment that says the host has one scope.
- `UPDATE: packages/sdk/src/host/tooling.ts:380-420` - keep the store's decisions out of a client plugin's session decision.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - the cases below, beside the toggle tests.

## Steps

1. Read the key with `enablementKeyOf` for the customization the action names.
2. Skip the store when there is no key or no `enablement` option, and act as now.
3. Treat the action's `enablement` array as a replacement, and clear each scope it leaves out.
4. Write the `global` entry with `setGlobal`.
5. Write the `workspace` entry with `setFolder`, for the folder the entry's `uri` names.
6. Keep the `session` entry where the host keeps it now.
7. Find each open session where the customization is now on or off where it was not.
8. Call `setCustomizationEnabled` on each of those sessions, or switch its client plugin.
9. Dispatch `session/customizationsChanged` to each of those sessions.

## Validation

- A global off in one session turns the customization off in a second open session.
- A folder off changes a session in that folder and not a session in another folder.
- A toggle with no global entry clears the global decision.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

- **State:** implemented. All 9 steps are in, and the four validation points pass.
- **What exists now:** `session/customizationToggled` reads the key with `customizationUnder`.
  It writes the `global` and `workspace` entries to the store, then switches every open session the change reaches.
  `customizationUnder` is new on the tooling and answers `{ key, of, own? }`.
  The `of` is `plugin` for a held plugin, `server` for a held server of one, and `backend` for anything the backend reported.
  The last one walks the reported children under the plugin that declared them.
  `folderOf` is new on the tooling and answers the folder a session's decisions are kept under, as a `file://` URI.
  `heldInStore` reads the store at read time, so `decisionsOf`, `partDecisions`, `enabledOf` and `partOff` all see a folder or global decision the moment it is written.
  `entryOf` now takes the session the entry is for.
  `toggleClientPlugin` writes the session's own decision only, and clears it when it equals what the session inherits.
- **Departures from the Steps:** step 6 says to keep the session entry where the host keeps it.
  The tooling also reads the store for the other scopes.
  That read is what makes a global or folder toggle reach a session at all.
  A plugin's on/off is worked out when it is read, not stored on the session.
  `entryOf` takes the session URI, so the published array carries the entries of the session it is published in.
  The doc comment on `HeldPlugin.decision` now says it holds the session's own decision alone.
  That is what keeps a store entry from appearing twice in the published list.
- **Validation:** a global off in the first session turns the plugin off in the second open session, which made no decision of its own.
  A folder off changes the session in that folder and leaves the session in the other folder alone.
  A toggle with the global entry gone clears the global decision and switches the other session back on.
  `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server --maxWorkers=2 --testTimeout=10000` pass, with 190 files and 3693 tests.
- **Watch out for:** `folderOf` falls back to `held.workingDirectory` when a session holds no chat.
  A session's client plugins are read while its backend is being started again, which is the moment the chat has been torn down.
  Without that fallback a folder decision is invisible to the restart, and the plugin comes back on the session it was switched off in.
- **Files changed by this task:**
  - `packages/sdk/src/host/chatactions.ts` (the `session/customizationToggled` case)
  - `packages/sdk/src/host/tooling.ts` (`keyOf`, `folderOf`, `heldInStore`, `decisionsOf`, `partDecisions`, `enabledOf`, `partOff`, `ownIn`, `byScope`, `heldBy`, `toggleClientPlugin`, `customizationUnder`, `entryOf`, and the `Carried` type with `folderOf` on the `Tooling` interface)
  - `packages/sdk/test/host-tools.test.ts` (the `a customization switched for every session or a folder` block: `twoSessions`, `pluginPeer` and three cases)
- **Uncommitted work outside this task:** the run of the sdk and server suites rewrote `packages/sdk/test/fixtures/wire.jsonl` (33 lines, the endpoint line and the `ahpd.` `_meta` lines).
  Every restore command is denied in this preset, so the file waits for Softov: `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
