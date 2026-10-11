---
title: The host takes a remote session and keeps its origin
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L732](../../../../packages/sdk/src/host/sessionmethods.ts#L732) - `createSession`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/meta/vscode/agentRemoteSessionMeta.ts - the origin shape and `withRemoteSessionOrigin`
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/state/sessionState.ts - `agentHost/sessionSpawnDepth` and `agentHost/createdBySession`
---

## Objective

Root `_meta['vscode.remoteSessions']` is `true`, and a session made with `vscode.remoteSession.origin` keeps the origin, its creator and its depth on its summary across a restart.

## Files

- `UPDATE: packages/sdk/src/host/root.ts:436-495` - add the flag.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:732` - read the origin from `config._meta`.
- `UPDATE: packages/sdk/test/host-handshake.test.ts` - the flag is present.
- `CREATE: packages/sdk/test/host-remote-session.test.ts` - the cases below.

## Steps

1. Read how `agentService.ts` reads, keeps and restores origin, creator and depth.
2. Add `'vscode.remoteSessions': true` to the root `_meta`.
3. Read `vscode.remoteSession.origin` from `createSession` `config._meta`, and refuse a malformed one as VS Code's host does.
4. Keep the origin, `agentHost/createdBySession` and `agentHost/sessionSpawnDepth` on the summary `_meta`, beside `agentHost/sessionArtifacts`.
5. Restore the three from the session store when the host starts.

## Validation

- A session made with an origin lists the origin, creator and depth on its summary.
- The three are still there after the host restarts.
- A session made without an origin has none of them.
- `pnpm exec vitest run packages/sdk` passes.

## Resume
