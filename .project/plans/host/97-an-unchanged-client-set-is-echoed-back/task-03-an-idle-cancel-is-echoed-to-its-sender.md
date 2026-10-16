---
title: An idle cancel is echoed to its sender
status: done
depends: [task-01-the-sender-hears-its-unchanged-set.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1096-L1099](../../../../packages/sdk/src/host/chatactions.ts#L1096-L1099) - `chat/turnCancelled` on a lead chat calls `cancel` and says nothing"
  - "[code://packages/sdk/src/host/chatactions.ts#L1106-L1110](../../../../packages/sdk/src/host/chatactions.ts#L1106-L1110) - a worker's chat reads `activeTurn` and refuses when nothing runs"
  - "[code://packages/sdk/src/host.ts#L746-L757](../../../../packages/sdk/src/host.ts#L746-L757) - `refuse`, beside the helper of task 01"
  - "[code://packages/sdk/test/host-catalogue.test.ts#L548-L550](../../../../packages/sdk/test/host-catalogue.test.ts#L548-L550) - a test that sends `chat/turnCancelled`"
---

## Objective

A `chat/turnCancelled` on a lead chat that changes nothing gets an echo with its `origin` to its sender only.
It changes nothing when no turn runs, or when the running turn is not the one it names.
The echo keeps the current `serverSeq`, as task 01's echo does.
A cancel that stops a turn is handled as now.

## Files

- `UPDATE: packages/sdk/src/host/chatactions.ts:1096-1099` - read `activeTurn` before `cancel`, and echo to the sender when it does not match.
- `UPDATE: packages/sdk/test` - the echo of an idle cancel, beside the test in `host-catalogue.test.ts`.

## Steps

1. Read `activeTurn` from `session.chatState()` on the lead chat, as the worker path does.
2. Call `cancel` when the running turn has the id that the action names.
3. Otherwise send the action to its sender with the helper of task 01.
4. Do not move `serverSeq`, and do not put the echo in the replay buffer.
5. Leave the worker path unchanged.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- A test: a cancel with no turn running gets one echo on the sender's peer.
- The echo carries its `clientSeq` and the current `serverSeq`.
- A test: a second client gets no action for that cancel.
- A test: a cancel of the running turn still stops it and reaches both clients.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume

Built 2026-10-16, uncommitted. The worktree holds `packages/sdk/src/host/chatactions.ts`, `packages/sdk/test/host-catalogue.test.ts` and `packages/sdk/test/usage-meter.test.ts`. `packages/sdk/test/fixtures/wire.jsonl` is dirty with the suite's own regeneration, which is not this task's; the restore command is denied here, so it is Softov's to run.

### What changed, file by file

- `packages/sdk/src/host/chatactions.ts` - the `chat/turnCancelled` handler on a lead chat reads `activeTurn` off `session.chatState()` before it calls `cancel` (step 1). When no turn runs, or the running turn is not the one the action names, the action goes back to its sender through `echoTo` and the handler breaks (steps 2, 3). The echo is to one peer at the current `serverSeq` and is never buffered, which is `echoTo`'s own doing (step 4). The worker branch below is untouched (step 5).
- `packages/sdk/test/host-catalogue.test.ts` - an `alsoWatching` helper opens a second client on a started session and its chat, beside the cancel tests. Three tests: a cancel that names a turn nobody runs gets one envelope on its sender, `origin` `{ clientId: 'probe', clientSeq: 7 }` and `serverSeq` the sequence the sender had already heard, and the second client gets none; a cancel of the running turn still stops it and reaches both clients; a cancel that names another turn (`t2` while `t1` runs) leaves `t1` alone and gets one envelope, the echo.
- `packages/sdk/test/usage-meter.test.ts` - the `metered` fake now reports `chatState`, adding the `activeTurn` it is holding to the session's own. The fake starts turns by emitting `chat/turnStarted` itself, so the example backend underneath never holds one, and the handler's read of `activeTurn` would have seen nothing.

### Verified

- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` all clean.
- `pnpm -s exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000`: 149 files, 2982 tests, all pass.

### Decided while building

- A cancel that names no turn, `turnId: ''` or absent, counts as naming the running turn and still stops it. The task's "when the running turn is not the one it names" has no name to disagree with there, and both example backends read `turnId || turn.id`, so an empty id has always meant the running turn. `notes.test.ts` sends `turnId: ''` while a turn runs and expects it stopped, which is the existing behaviour the Objective's "a cancel that stops a turn is handled as now" keeps.
- The strict reading - echo unless the id matches exactly - failed `notes.test.ts` and, through the same read, `usage-meter.test.ts`.
