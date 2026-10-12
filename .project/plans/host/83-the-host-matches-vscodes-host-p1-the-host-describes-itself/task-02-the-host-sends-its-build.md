---
title: The host sends its build and keeps its session URIs
status: implemented
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta` that gets `hostBuild`"
  - "[code://packages/sdk/src/host/handshake.ts#L267-L297](../../../../packages/sdk/src/host/handshake.ts#L267-L297) - the initialize `_meta` that gets `vscode.ahpSessionUris`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/state/sessionState.ts - `readHostBuildInfo`, the shape of `hostBuild`
---

## Objective

Root `_meta.hostBuild` is `{ version }`, and initialize `_meta['vscode.ahpSessionUris']` is `true`, so VS Code logs the version and keeps ahpd's session URIs.

## Files

- `UPDATE: packages/sdk/src/host/root.ts` - `hostBuild` in the root `_meta`.
- `UPDATE: packages/sdk/src/host/handshake.ts` - `vscode.ahpSessionUris` in the initialize `_meta`.
- `UPDATE: packages/sdk/test/host-handshake.test.ts` - both keys are present.
- `UPDATE: packages/sdk/test/wire.test.ts` - the census knows `hostBuild` at `state/_meta`.
- `UPDATE: packages/sdk/test/root-config.test.ts` - the `apart` helper drops `hostBuild` too.
- `UPDATE: packages/sdk/test/users-gate-commands.test.ts` - the `rootMeta` helper drops `hostBuild` too.

## Steps

1. Read the version from `version.ts`.
2. Add `hostBuild: { version }` to the root `_meta`, and leave it out when the version is `unknown`.
3. Add `'vscode.ahpSessionUris': true` to the initialize `_meta`.
4. Write a comment on each key that names decision `ahpd-says-it-is-a-native-host`.
5. Commit both keys in one commit.

## Validation

- A test finds `hostBuild.version` in the root state and `vscode.ahpSessionUris` in the initialize answer.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

Both keys are in, each with a comment naming decision `ahpd-says-it-is-a-native-host`. Step 5 asked for one commit holding both keys; this preset neither adds nor commits, so the two files below are the one change for whoever commits them.

The wire capture's census had to learn `hostBuild`: it is VS Code's name and not the protocol's, so it is neither prefixed nor declared, and the recording is where that shows.

Files changed:

- `packages/sdk/src/host/root.ts`
- `packages/sdk/src/host/handshake.ts`
- `packages/sdk/test/host-handshake.test.ts`
- `packages/sdk/test/wire.test.ts`
- `packages/sdk/test/root-config.test.ts`
- `packages/sdk/test/users-gate-commands.test.ts`

Also touched by the run of `pnpm exec vitest run packages/sdk`, which rewrites its own capture: `packages/sdk/test/fixtures/wire.jsonl`. The restore command is denied in this preset, so Softov reverts it if the recording is not wanted.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000` pass; a plain run flakes on `nested-start` under load.
