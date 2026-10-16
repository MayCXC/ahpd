---
title: The parser is a port
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a parser may be async; decide the type from the backends' call sites in p4 and p5.
