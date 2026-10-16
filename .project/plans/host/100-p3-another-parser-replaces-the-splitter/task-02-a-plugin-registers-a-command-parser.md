---
title: A plugin registers a command parser
status: todo
depends: [task-01-the-parser-is-a-port.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L762-L770](../../../../packages/sdk/src/types/plugin.ts#L762-L770) - `registerPolicies` and `registerVault`"
  - "[code://packages/sdk/src/plugins.ts#L1141-L1142](../../../../packages/sdk/src/plugins.ts#L1141-L1142) - their `setPort` calls"
  - "[code://packages/sdk/src/validate.ts#L176-L177](../../../../packages/sdk/src/validate.ts#L176-L177) - the port to method map"
---

## Objective

`PluginHost.registerCommandParser(split, when?)` sets the port, as `registerVault` sets its own.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:762-770` - `registerCommandParser` and its doc.
- `UPDATE: packages/sdk/src/plugins.ts:1141-1142` - the method calls `setPort`.
- `UPDATE: packages/sdk/src/validate.ts:176-177` - the port names its method.
- `UPDATE: packages/sdk/test` - a plugin's parser reaches the check, and a second one is refused.

## Steps

1. Add `registerCommandParser` to `PluginHost`.
2. Make it call `setPort('commandParser', ...)`.
3. Add the port to the map in `validate.ts`.
4. Check that the value is a function.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** `checkPort` may check the shape of each port; give it the one for a function.
