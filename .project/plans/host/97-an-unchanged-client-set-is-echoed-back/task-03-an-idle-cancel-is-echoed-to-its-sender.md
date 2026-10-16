---
title: An idle cancel is echoed to its sender
status: todo
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
