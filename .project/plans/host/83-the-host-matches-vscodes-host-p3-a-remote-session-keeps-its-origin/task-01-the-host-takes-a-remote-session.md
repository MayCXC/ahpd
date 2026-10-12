---
title: The host takes a remote session and keeps its origin
status: implemented
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

- `CREATE: packages/sdk/src/remotesession.ts` - the window's five keys and its reader, in one place.
- `UPDATE: packages/sdk/src/types/sessions.ts:36-65` - `RemoteOrigin`, `CreatedBy` and the four store methods.
- `UPDATE: packages/sdk/src/sessions.ts` - both stores keep the two, and a file row is read back through the reader.
- `UPDATE: packages/sdk/src/host/root.ts:498-508` - add the flag.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1212-1229` - `openSession` reads the origin and the creator from the config.
- `UPDATE: packages/sdk/src/host/facts.ts:176-231` - `describes` publishes the three keys.
- `UPDATE: packages/sdk/src/index.ts:92` - the two types are public, because `SessionStore` names them.
- `UPDATE: packages/sdk/test/host-handshake.test.ts:52-70` - the flag is present.
- `UPDATE: packages/sdk/test/root-config.test.ts:686-694` - the flag is not part of what a snapshot says about one person.
- `UPDATE: packages/sdk/test/users-gate-commands.test.ts:552-566` - the same.
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

The flag is on the root `_meta` in `packages/sdk/src/host/root.ts`, beside the machine's resources. The origin, the session that made this one and the depth are kept by the session store and published by `describes` in `packages/sdk/src/host/facts.ts`. The five keys and the reader are in `packages/sdk/src/remotesession.ts`. It is a core module and not a host one. The store can then validate a row it reads back with the same reader that accepted it.

The origin is read in `openSession` in `packages/sdk/src/host/lifecycle.ts`, and not in `createSession` in `packages/sdk/src/host/sessionmethods.ts` as the Files list said. Every road into a session goes through `openSession`: `createSession`, the `create` tool, an automation and a changed session. `backendsOwn` keeps `_meta`, so the config arrives there whole.

The write happens only where the config carried a value. A session opened again is the same session, and not one this host was just told about. That is a row read off disk, or a directory added. So opening one again never clears a stored origin.

Step 3 says to refuse a malformed origin as VS Code's host does. VS Code's host does not refuse one: `readRemoteSessionOrigin` answers nothing and `agentService.ts` creates the session anyway, at line 5061 and at line 6284. The code drops a malformed origin and makes the session, which is the parity reading the plan's first locked row asks for. The refusal upstream is for a persisted value, and even there it is downgraded to a warning. This reading is the plan's open question.

Depth is the deeper of the origin's own and the depth the backend publishes, which is the window's own arithmetic. The depth the backend publishes is read from its session state, so a later send on from here counts from the furthest point.

Files changed:

- `packages/sdk/src/remotesession.ts`
- `packages/sdk/src/types/sessions.ts`
- `packages/sdk/src/sessions.ts`
- `packages/sdk/src/host/root.ts`
- `packages/sdk/src/host/lifecycle.ts`
- `packages/sdk/src/host/facts.ts`
- `packages/sdk/src/index.ts`
- `packages/sdk/test/host-handshake.test.ts`
- `packages/sdk/test/root-config.test.ts`
- `packages/sdk/test/users-gate-commands.test.ts`
- `packages/sdk/test/host-remote-session.test.ts`

`packages/sdk/src/index.ts` is the one file the task did not name. `SessionStore` is public and now names `RemoteOrigin` and `CreatedBy`, so both types are exported with that module's rest.

Also touched by the run of `pnpm exec vitest run packages/sdk`, which rewrites its own capture: `packages/sdk/test/fixtures/wire.jsonl`. The restore command is denied in this preset, so Softov reverts it if the recording is not wanted.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000` pass.
