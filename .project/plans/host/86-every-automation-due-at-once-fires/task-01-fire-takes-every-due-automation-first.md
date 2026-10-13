---
title: fire takes every due automation before it announces one
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/scheduled.ts#L516-L531](../../../../packages/server/src/scheduled.ts#L516-L531) - `fire`, the loop that changes"
  - "[code://packages/server/test/scheduled.test.ts](../../../../packages/server/test/scheduled.test.ts) - the cases to extend"
---

## Objective

`fire` collects every due automation and its time first, then calls the `due` listeners for each.
A rearm that a listener causes cannot hide an automation that was due.

## Files

- `UPDATE: packages/server/src/scheduled.ts:516-531` - `fire` collects the due list before it announces.
- `UPDATE: packages/server/test/scheduled.test.ts` - the cases below.

## Steps

1. Read the plan's *Decisions locked in* row.
2. In `fire`, build a list of each due automation, its `when` and its origin before any listener runs.
3. Call the `due` listeners for each entry of that list.
4. Call `rearm` once, after the list.
5. Add the test cases below, with a listener that writes to the store as a run does.

## Validation

- `scheduled.test.ts`: two automations with one schedule both get a `due` event at that time.
- `scheduled.test.ts`: a `due` listener that writes the store does not stop the second event.
- `scheduled.test.ts`: the existing cases still pass.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

