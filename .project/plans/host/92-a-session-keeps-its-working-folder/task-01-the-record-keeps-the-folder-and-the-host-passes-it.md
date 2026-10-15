---
title: The record keeps the folder, and the host passes it
status: todo
depends: []
layer: "packages/sdk, docs"
refs:
  - "[code://packages/sdk/src/sessions.ts#L331-L347](../../../../packages/sdk/src/sessions.ts#L331-L347) - `Row`, where the field goes"
  - "[code://packages/sdk/src/types/agent.ts#L611](../../../../packages/sdk/src/types/agent.ts#L611) - `find`, which takes the new argument"
  - "[code://packages/sdk/src/types/agent.ts#L685](../../../../packages/sdk/src/types/agent.ts#L685) - `transcript`, the same"
  - "[code://packages/sdk/src/types/agent.ts#L699](../../../../packages/sdk/src/types/agent.ts#L699) - `subagents`, the same"
  - "[code://packages/sdk/src/host/history.ts#L263-L275](../../../../packages/sdk/src/host/history.ts#L263-L275) - `findOf`, a caller"
  - "[code://packages/sdk/src/host/history.ts#L364](../../../../packages/sdk/src/host/history.ts#L364) - `past`, a caller"
  - "[code://packages/sdk/src/host/snapshots.ts#L391](../../../../packages/sdk/src/host/snapshots.ts#L391) - a subscribe, a caller"
  - "[code://packages/sdk/src/host/sleep.ts#L279-L301](../../../../packages/sdk/src/host/sleep.ts#L279-L301) - the sleep restore, a caller"
  - "[code://docs/AGENT.md#L84](../../../../docs/AGENT.md#L84) - the `Agent` table"
---

## Objective

The session record keeps the session's working folder, and the host gives it to each backend call that finds or reads the session.

## Files

- `UPDATE: packages/sdk/src/sessions.ts:331-347` - `Row` and `Saved` keep `workingDirectory`, with a getter and a setter.
- `UPDATE: packages/sdk/src/types/agent.ts:611` - `find(id, at?)`, where `at` is `{ workingDirectory?: string }`.
- `UPDATE: packages/sdk/src/types/agent.ts:685` - `transcript(id, at?)`.
- `UPDATE: packages/sdk/src/types/agent.ts:699` - `subagents(id, turns, at?)`.
- `UPDATE: packages/sdk/src/host/history.ts:263-275` - `findOf` passes the recorded folder, and records the folder of the row it finds.
- `UPDATE: packages/sdk/src/host/history.ts:364` - `past` passes the folder to `transcript`.
- `UPDATE: packages/sdk/src/host/snapshots.ts:391` - the subscribe passes the folder to `transcript` and `subagents`.
- `UPDATE: packages/sdk/src/host/sleep.ts:279-301` - the sleep restore passes the folder.
- `UPDATE: docs/AGENT.md:84` - the table names the `at` argument.
- `UPDATE: packages/sdk/test/host-past-open.test.ts` - the cases below.

## Steps

1. Add `workingDirectory` to `Row` and `Saved`, and read it back only when it is a string that is not empty.
2. Add `workingDirectory(id)` and `setWorkingDirectory(id, folder)` to the store, as `owner` and `setOwner` are.
3. Record the folder when the host creates a session with a `workingDirectory`.
4. Record the folder when a listing or a `find` gives a row with `workingDirectory` and the record has none.
5. Add the optional `at` argument to `find`, `transcript` and `subagents` in `Agent`.
6. Pass `{ workingDirectory }` from the record at each caller in the Files list.
7. Name the argument in the `Agent` table of `docs/AGENT.md`.
8. Add the test cases below.

## Validation

- `host-past-open.test.ts`: a `find` stub that answers only for its folder opens a session whose record names that folder.
- `host-past-open.test.ts`: a session with no folder in its record calls `find` with no folder, as today.
- `host-past-open.test.ts`: a created session writes its folder to the record file.
- A store test: a saved record with `workingDirectory` loads it back, and a record without it loads as before.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

