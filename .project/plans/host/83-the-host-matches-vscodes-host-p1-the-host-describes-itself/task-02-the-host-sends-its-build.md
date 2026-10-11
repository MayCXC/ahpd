---
title: The host sends its build and keeps its session URIs
status: todo
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

- `UPDATE: packages/sdk/src/host/root.ts:436-495` - add `hostBuild`.
- `UPDATE: packages/sdk/src/host/handshake.ts:267-297` - add `vscode.ahpSessionUris`.
- `UPDATE: packages/sdk/test/host-handshake.test.ts` - both keys are present.

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
