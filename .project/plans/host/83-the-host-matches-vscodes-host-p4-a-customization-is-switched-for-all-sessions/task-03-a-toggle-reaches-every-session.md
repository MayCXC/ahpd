---
title: A toggle records each scope and reaches every session
status: todo
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
