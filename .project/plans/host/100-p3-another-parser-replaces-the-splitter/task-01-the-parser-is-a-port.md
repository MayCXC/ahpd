---
title: The parser is a port
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L351-L366](../../../../packages/sdk/src/types/plugin.ts#L351-L366) - `PortKey`"
  - "[code://packages/sdk/src/types/host.ts#L73](../../../../packages/sdk/src/types/host.ts#L73) - `HostOptions`"
---

## Objective

`HostOptions.commandParser` holds the `split` that `getAutoApproval` calls.
Absent, it is the sdk's splitter.

## Files

- `UPDATE: packages/sdk/src/types/host.ts:73` - the `commandParser` option.
- `UPDATE: packages/sdk/src/types/plugin.ts:351-366` - `commandParser` joins `PortKey`.
- `UPDATE: packages/sdk/src/host/spawn.ts` - the check calls the port.
- `UPDATE: packages/sdk/test` - a parser from the option is called, and one that throws makes the call ask.

## Steps

1. Add `commandParser` to `HostOptions` and to `PortKey`.
2. Call the option's `split` in `getAutoApproval`, or the sdk's splitter when it is absent.
3. Treat a throw or a value of the wrong shape as `undefined`.
4. Write the tests.
5. Set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** steps 1 to 4, 2026-10-19. `HostOptions.commandParser` and `PortKey`'s `commandParser` are in `packages/sdk/src/types/host.ts` and `packages/sdk/src/types/plugin.ts`, with the doc each one carries. `getAutoApproval` reads every line through a wrapper in `packages/sdk/src/host/spawn.ts`: the option's parser when there is one, the sdk's `splitCommand` otherwise. A throw, or a value whose `subCommands`, `writeDests` or `unanalyzable` is not the declared kind, is `undefined`, which asks. `packages/sdk/test/commandparser.test.ts` is new, 3 cases, all passing. The related sdk suites (autoapproval, commandautoapprover, commandsplit and this file) pass, 74 cases.
- **Next action:** [task-02-a-plugin-registers-a-command-parser.md](task-02-a-plugin-registers-a-command-parser.md).
- **Open questions:** none.
- **Watch out for:** the type is synchronous (`CommandSplitter`), because `Start.getAutoApproval` is synchronous; a backend cannot wait for a promise before it asks. The shape check is strict: `unanalyzable` is required, since treating it as absent would approve a line on a guess.
- **Departed from the plan:** `PortKey` gained a member, so the runtime half had to gain it in the same step. `PORT_KEYS` is in `packages/sdk/src/plugins/plugins.ts`. `PORT_METHOD`, `PORT_MEMBERS` and the new `PORT_ITSELF` are in `packages/sdk/src/plugins/validate.ts`. The task names `plugin.ts` and `host.ts` only, and `Unlisted` and `PORT_METHOD` are compile-time exhaustiveness checks that would not build otherwise. `PORT_ITSELF` is new because a function is not an object with members, and `checkPort` reads a port as one.
