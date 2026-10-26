---
title: An action call carries the attachments folder
status: todo
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
