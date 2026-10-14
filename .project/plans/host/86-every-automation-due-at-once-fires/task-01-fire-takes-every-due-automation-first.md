---
title: fire takes every due automation before it announces one
status: implemented
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

Implemented 2026-10-13. `fire` now takes every automation due at the instant before it announces any of them. It announces that list, then rearms once. A run a listener makes can no longer hide the automation due beside it.

### What changed, file by file

- `packages/server/src/scheduled.ts` - `fire` builds `ready`, one entry per due automation. An entry holds the resource, its `when` and its `origin` (step 2). `fire` then calls the `due` listeners for each entry (step 3), and calls `rearm` once after the list (step 4). The `soonest(automation, new Date(when.getTime() - 1))` call and the `origin` bag are unchanged, moved into the building loop. The one `rearm` at the end and the one `due` event per automation stay as they were.
- `packages/server/test/scheduled.test.ts` - `TWO` beside `ONE`, and one nested describe inside `when the time comes` (step 5).

### The two cases

- *says both are due, then arms both for the next one* - two automations on `0 9 * * *` and one clock, with no listener that writes. Both get a `due` event at nine, and both are armed for the next day. This case passes against the unfixed `fire` too. It is the plain statement of what the plan's *Goal* asks for.
- *still says the second one when the first listener runs it* - the same two automations, with a `due` listener that runs each one as the host does. That call is `store.run(event.automation, event.origin, ...)`. This is the case that fails: a run writes the store, the write reaches the inner store's `onChanged`, and `rearm` moves the second automation's `nextAt` to tomorrow. Against the unfixed `fire` it fails at `scheduled.test.ts:234`, seen as `[ 'ahp-automation:/one' ]`. With the fix it passes.

### Where the plan and the code agree

- Every step matched the code as written, including the `fire` range in the refs (:516-531, 16 lines then). Nothing had to be guessed.

### Seen, and not this task's

- `catchUp` announces a `due` event per missed occurrence too, and it does not have this fault. Its list is the `wasWaiting` array `load` returned, taken before any listener runs, so a rearm in the middle cannot move an entry it is walking.
- `onChanged` keeps its order: `rearm`, then `save`, then the `changed` listeners. That is what its comment asks for, and the case *announces the change with the clock already caught up* holds it.

### Validation

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0. The schema is unchanged: 508 definitions from 506 exported types.
- vitest over `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` in one run, with `--maxWorkers=2 --testTimeout=15000`: 4343 cases passed in 241 files. `scheduled.test.ts` is 31 of them, two new.
- The first `pnpm -s typecheck` was killed, exit 137, with the box at load 106 on 8 cores and swap full. The retry passed.

### Left

- `packages/sdk/test/fixtures/wire.jsonl` was rewritten by this run. It is 33 lines: the endpoint line and the `ahpd.` `_meta` lines, none of it this task's. `git checkout -- packages/sdk/test/fixtures/wire.jsonl` is denied in this session, so run it before committing.
- Nothing is committed. This task's own files are the two above, plus the plan and index rows.

