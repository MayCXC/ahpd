---
title: A device hears its person's sessions
status: todo
depends: []
layer: push
refs:
  - "[code://packages/push/src/provider.ts#L52-L72](../../../../packages/push/src/provider.ts#L52-L72) - `Device`"
  - "[code://packages/push/src/provider.ts#L128-L143](../../../../packages/push/src/provider.ts#L128-L143) - `kept`"
  - "[code://packages/push/src/provider.ts#L313-L324](../../../../packages/push/src/provider.ts#L313-L324) - `write`"
  - "[code://packages/push/src/plugin.ts#L85-L95](../../../../packages/push/src/plugin.ts#L85-L95) - `audience`"
  - "[code://packages/sdk/src/types/plugin.ts#L995](../../../../packages/sdk/src/types/plugin.ts#L995) - `sessionOwner`"
---

## Objective

A device keeps its person and an `audience` setting, `person` or `device`.
A `person` device hears every session its person owns, and every session its client created or opened.
A `device` device hears only the sessions its client created or opened.

## Files

- `UPDATE: packages/push/src/provider.ts:52-72` - `Device` gains `owner?` and `audience?`.
- `UPDATE: packages/push/src/provider.ts:128-143` - `kept` reads `owner` and `audience`.
- `UPDATE: packages/push/src/provider.ts:217-244` - `deviceOf` accepts `audience` of `person` or `device`.
- `UPDATE: packages/push/src/provider.ts:313-324` - `write` stores the writer's `owner`.
- `UPDATE: packages/push/src/plugin.ts:85-95` - `audience` becomes async and picks the devices by their setting.
- `UPDATE: packages/push/test/provider.test.ts` - add the cases of this task.
- `CREATE: packages/push/test/plugin.test.ts` - the audience cases.

## Steps

1. Add `owner?: Owner` and `audience?: 'person' | 'device'` to `Device`.
2. In `deviceOf`, refuse an `audience` that is not `person` or `device` with `-32602`.
3. In `write`, store `owner` when the host hands one.
4. In `kept`, read `owner` and `audience` when they are strings.
5. Make `audience` async, and read `host.sessionOwner(session)` once per call.
6. Pick a device when its client created or opened the session.
7. Also pick a device whose audience is not `device`, when its owner equals the session's owner.
8. Await `audience` in `notify`.
9. Add a test that a `person` device hears a session that another client of the same owner created.
10. Add a test that a `device` device does not hear that session.
11. Add a test that a device with no owner hears only its client's sessions.
12. Add a test that `deviceOf` refuses a bad `audience`.

## Validation

- `packages/push/test/provider.test.ts` and `plugin.test.ts` pass.
- `pnpm typecheck` is clean.
