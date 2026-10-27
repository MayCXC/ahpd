---
title: An action call carries the attachments folder
status: done
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/connectors/actions.ts#L31-L45](../../../../packages/sdk/src/connectors/actions.ts#L31-L45) - `ActionHost`, which gains `attachmentsDir`"
  - "[code://packages/sdk/src/connectors/actions.ts#L153-L158](../../../../packages/sdk/src/connectors/actions.ts#L153-L158) - the tool call, which knows the session"
  - "[code://packages/sdk/src/connectors/channel.ts#L450-L468](../../../../packages/sdk/src/connectors/channel.ts#L450-L468) - the channel's `run`"
  - "[code://packages/sdk/src/types/connectors.ts#L289](../../../../packages/sdk/src/types/connectors.ts#L289) - `Adapter.run`"
  - "[code://packages/sdk/src/host/tooling.ts#L533](../../../../packages/sdk/src/host/tooling.ts#L533) - the host's `ActionHost`"
---

## Objective

An adapter's `run` gets the attachments folder of the session that called the action.
An adapter that does not read the new argument is not changed.

## Files

- `UPDATE: packages/sdk/src/types/connectors.ts:289` - add `call?: { files?: string }` to `Adapter.run`, with a comment that says what `files` is.
- `UPDATE: packages/sdk/src/connectors/actions.ts:31-45` - add `attachmentsDir(uri: string): string | undefined` to `ActionHost`.
- `UPDATE: packages/sdk/src/connectors/actions.ts:153-158` - read the session's folder and pass it to `run`.
- `UPDATE: packages/sdk/src/connectors/channel.ts:450-468` - take the folder, and pass it to `adapter.run` as `call.files`.
- `UPDATE: packages/sdk/src/host/tooling.ts:533` - give the host's `ActionHost` an `attachmentsDir` that reads the session store.
- `UPDATE: packages/sdk/test/connector-actions.test.ts` - a case where the adapter receives the session's folder, and one with no folder.
- `UPDATE: docs/plugins/PLUGINS.md` - say what `call.files` is, where `Adapter.run` is described.

## Steps

1. Add the optional `call` argument to `Adapter.run`.
2. Add `attachmentsDir` to `ActionHost`.
3. In the host's `ActionHost`, return the session store's `attachmentsDir` for the session's id.
4. In the action tool, read the folder of `at.session` and pass it to the channel's `run`.
5. In the channel's `run`, pass `{ files }` to `adapter.run` when the session has a folder.
6. Add the two test cases, and update `PLUGINS.md`.

## Validation

- `pnpm exec vitest run packages/sdk/test/connector-actions.test.ts` passes, with the new cases.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.

## Resume

- **Done so far:** `Adapter.run` takes an optional fourth argument, `call`, of `{ files?: string }`, documented as the folder where one session's attachments are kept. `ConnectorsChannel.run` takes that folder and hands `adapter.run` a `call` only when the session has one. An adapter on a host with no store sees the same absence a session with no folder gives it. `ActionHost` carries `attachmentsDir(uri)`, and the action tool reads `host.attachmentsDir(at.session)` before it runs, so the folder travels with the call and no caller names one. The host builds that member in `tooling.ts` as `kept.attachmentsDir?.(idOf(uri))`, which is the session store's own answer. Two cases in `packages/sdk/test/connector-actions.test.ts` pin the two answers. A `fileSessions` store gives the adapter the calling session's folder, and the default `memorySessions` store gives it no `files`. `PLUGINS.md` says what `call.files` is, beside `Adapter.run`.
- **Next action:** [task-02-a-file-prop-takes-a-string.md](task-02-a-file-prop-takes-a-string.md).
- **Files:** `packages/sdk/src/types/connectors.ts`, `packages/sdk/src/connectors/actions.ts`, `packages/sdk/src/connectors/channel.ts`, `packages/sdk/src/host/tooling.ts`, `packages/sdk/test/connector-actions.test.ts`, `docs/plugins/PLUGINS.md`, this task file, the plan and the index. The session cannot commit, so they are left in the worktree.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** the call carries the folder and never the session, so an adapter resolves nothing of its own. A session with no folder gets no `call`, rather than a `call` without `files`. That is the shape `exactOptionalPropertyTypes` asks for, and the one an adapter reads without a second check.
