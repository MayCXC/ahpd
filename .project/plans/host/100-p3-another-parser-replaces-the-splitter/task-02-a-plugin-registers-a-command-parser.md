---
title: A plugin registers a command parser
status: done
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

- **Done so far:** steps 1 to 5, 2026-10-19. `registerCommandParser(split, when?)` is on `PluginHost` in `packages/sdk/src/types/plugin.ts`, beside `registerRecords`, with the doc saying what the reader is and what `replace` does. Its implementation in `packages/sdk/src/plugins.ts` calls `setPort('commandParser', 'registerCommandParser', split, when)`. `packages/sdk/src/validate.ts` names the method in `PORT_METHOD`, the members in `PORT_MEMBERS` (none, since the value is a function) and the kind in the new `PORT_ITSELF` map. `packages/sdk/test/commandparser.test.ts` gained the five cases of this task. The fold names the parser. A plugin's parser reaches the check. A non-function is refused naming the plugin and the method. A second registration by one plugin is refused. Two plugins without `replace` give one problem that names both and keeps the first. The file is 8 cases, all passing; the sdk suite is 3236 passed and 2 skipped.
- **Next action:** [task-03-a-config-key-loads-a-parser-module.md](task-03-a-config-key-loads-a-parser-module.md).
- **Open questions:** none.
- **Watch out for:** `checkPort` reads a port as an object with members, and a parser is a function. The `PORT_ITSELF` branch in `checkPort` is what lets this port be checked at all, and it returns before `asObject` runs.
- **Departed from the plan:** none beyond task 01's `PORT_KEYS`, `PORT_METHOD`, `PORT_MEMBERS` and `PORT_ITSELF` additions. Those are the same four the compile-time exhaustiveness checks need for any new `PortKey`.
