---
title: The root state says what machine the host runs on
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostResources.ts - the measure VS Code's host takes
---

## Objective

Root `_meta['vscode.agentHost.resources']` holds `platform`, `architecture`, `cpuCount` and `memoryBytes`, as VS Code's host sends them.

## Files

- `UPDATE: packages/sdk/src/host/root.ts:436-495` - add the key to the root `_meta`.
- `UPDATE: packages/sdk/test/host-handshake.test.ts` - the root state holds the key with positive integers.

## Steps

1. Measure the machine once at host start, with `node:os`.
2. Map `win32` to `windows`, `linux` to `linux` and `darwin` to `macos`.
3. Leave out `platform` on any other system.
4. Set `cpuCount` to `availableParallelism()`.
5. Set `memoryBytes` to the smaller of `totalmem()` and `process.constrainedMemory()` when the second is positive.
6. Leave out a count that is not a positive safe integer.
7. Add the key to the root `_meta` for every connection.

## Validation

- A test reads the root state and finds the key, with `cpuCount` and `memoryBytes` above zero.
- `pnpm exec vitest run packages/sdk` passes.

## Resume
