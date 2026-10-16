---
title: The host keeps a session decision
status: todo
depends: [task-01-claude-switches-a-builtin-plugin.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1312-L1322](../../../../packages/sdk/src/host/chatactions.ts#L1312-L1322) - the refusal and the list sent again"
  - "[code://packages/sdk/src/host/tooling.ts#L530-L545](../../../../packages/sdk/src/host/tooling.ts#L530-L545) - `entriesFor`"
  - "[code://packages/sdk/src/host/tooling.ts#L823-L846](../../../../packages/sdk/src/host/tooling.ts#L823-L846) - `customizationUnder`"
  - "[code://packages/sdk/test/host-harness.test.ts#L680-L687](../../../../packages/sdk/test/host-harness.test.ts#L680-L687) - the refusal test"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostCustomizationEnablementService.ts#L112-L127 - VS Code keys a session decision by id"
---

## Objective

When a backend switches a customization for one session, the host keeps that decision by id.
`customizationUnder` returns it as `own`, so `withEntries` puts the `session` entry first.
The session's customizations then report the decision, and the switch does not move back.

## Files

- `UPDATE: packages/sdk/src/host/tooling.ts:823-846` - a backend customization answers the session decision as `own`.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1312-1322` - a switch that took keeps the decision and sends the list with it.
- `UPDATE: packages/sdk/test/host-harness.test.ts:680-687` - a plugin toggle that took is not refused.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - a session toggle of a backend plugin stays off.

## Steps

1. Add a map of session decisions by id for each session, beside the store.
2. Write the decision in the map when `setCustomizationEnabled` answers `true`.
3. Make `customizationUnder` return that decision as `own` for a backend customization.
4. Send `session/customizationsChanged` with the list after a switch that took.
5. Keep the refusal for a switch that did not take.
6. Remove the session's decisions when the session closes.
7. Write the tests.
8. Set this task and the plan row to `implemented`.

## Validation

- A test: a session toggle of a backend plugin answers `true`, and `customizations()` reports a `session` entry with `enabled: false`.
- A test: a later snapshot of the session reports the same entry.
- A test: a skill toggle is still refused with `has no runtime switch`.
- A test: another session keeps the plugin on.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
