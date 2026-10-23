---
title: A backend reports a task and the host draws it
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L1093-L1107](../../../../packages/sdk/src/host/spawn.ts#L1093-L1107) - the `Start` seams this one sits beside"
  - "[code://packages/sdk/src/host/spawn.ts#L188-L200](../../../../packages/sdk/src/host/spawn.ts#L188-L200) - `absorb`, for a worker chat's row"
  - "[code://packages/sdk/src/host/snapshots.ts#L310-L335](../../../../packages/sdk/src/host/snapshots.ts#L310-L335) - the lead chat's snapshot"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/common/meta/vscode/agentHostBackgroundWorkStopMeta.ts - the flag and its helpers"
---

## Objective

A backend reports a background task with `Start.backgroundTasks.set` and ends it with `remove`.
The host builds the protocol row, sends it on the chat, and puts it in the chat's snapshot.

## Files

- `CREATE: packages/sdk/src/types/background.ts` - `BackgroundTask` and `BackgroundTasks`.
- `UPDATE: packages/sdk/src/types/agent.ts` - `Start.backgroundTasks`.
- `UPDATE: packages/sdk/src/index.ts` - export the two types.
- `CREATE: packages/sdk/src/host/background.ts` - the records per chat, the row builder, the stop flag helpers.
- `UPDATE: packages/sdk/src/host/spawn.ts` - hand `backgroundTasks` to the backend, and route a worker chat's row through `absorb`.
- `UPDATE: packages/sdk/src/host/snapshots.ts` - lay `backgroundWork` on the lead chat's snapshot.
- `UPDATE: packages/sdk/src/host/lifecycle.ts` - drop a session's records on close.
- `CREATE: packages/sdk/test/host-background-tasks.test.ts` - the cases below.

## Steps

1. Define `BackgroundTask` with the fields in the plan's Answers table.
2. Define `BackgroundTasks` with `set(chat, task)` and `remove(chat, id)`.
3. Add `backgroundTasks` to `Start`, beside `subagent` and `planUpdate`.
4. Keep a map from chat to task id to record in `host/background.ts`.
5. Build the row: `kind`, `id`, `label`, `startedAt`, then `command` and `terminal` for a shell, or `chat` for a subagent.
6. Add `_meta['vscode.stopBackgroundWork']: true` when the task has `stop`.
7. Send `chat/backgroundWorkSet` on `set` only when the row differs from the last one sent.
8. Send `chat/backgroundWorkRemoved` on `remove` for a known id, and ignore an unknown id.
9. Send a worker chat's actions through `absorb` before the dispatch.
10. Read the records into the lead chat's snapshot, and leave `backgroundWork` absent when there are none.
11. Drop a session's records on close, and send nothing.
12. Drop a `chat/backgroundWork*` action that a backend emits, and log one line.
13. Write the tests.
14. Set this task and its plan row to `implemented`.

## Validation

- A shell set reaches a live client with `command`, and a later snapshot holds it.
- A set with `stop` carries the flag, and a set without it does not.
- The same set twice sends one action.
- A set on a worker chat reaches a late subscriber of that chat.
- A remove sends one action, and an unknown id sends none.
- A session's close sends no action.
- A `chat/backgroundWorkSet` that a backend emits reaches no client, and the host logs one line.
- `pnpm exec tsc --noEmit`, `pnpm boundary` and `pnpm test` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** compare rows by value, not by object, or every poll looks like a change.
