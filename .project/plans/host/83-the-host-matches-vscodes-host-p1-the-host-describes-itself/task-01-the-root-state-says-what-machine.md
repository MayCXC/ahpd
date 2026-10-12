---
title: The root state says what machine the host runs on
status: implemented
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostResources.ts - the measure VS Code's host takes
---

## Objective

Root `_meta['vscode.agentHost.resources']` holds `platform`, `architecture`, `cpuCount` and `memoryBytes`, as VS Code's host sends them.

## Files

- `UPDATE: packages/sdk/src/host/root.ts` - `hostResources` and `capacity`, and the key in the root `_meta`.
- `UPDATE: packages/sdk/test/host-handshake.test.ts` - the root state holds the key with positive integers.
- `UPDATE: packages/sdk/test/root-config.test.ts` - the `apart` helper drops the key with `ahpd.grants`.
- `UPDATE: packages/sdk/test/users-gate-commands.test.ts` - the `rootMeta` helper drops the key with `ahpd.grants`.

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

`hostResources` measures once, in `createRoot`, and the root `_meta` carries the key only when something was measured. Two test helpers that compare a connection's own `_meta` now drop the key beside `ahpd.grants`, because it says the same thing to every connection.

Files changed:

- `packages/sdk/src/host/root.ts`
- `packages/sdk/test/host-handshake.test.ts`
- `packages/sdk/test/root-config.test.ts`
- `packages/sdk/test/users-gate-commands.test.ts`

Also touched by the run of `pnpm exec vitest run packages/sdk`, which rewrites its own capture: `packages/sdk/test/fixtures/wire.jsonl`. The restore command is denied in this preset, so Softov reverts it if the recording is not wanted.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000` pass; a plain run flakes on `nested-start` and `host-catalogue-held` under load.
