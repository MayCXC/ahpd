---
title: It opens with its kept turns
status: todo
depends: [task-01-the-catalogue-lists-it.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/history.ts#L324-L342](../../../../packages/sdk/src/host/history.ts#L324-L342) - a nested session opens from the host's record"
  - "[code://packages/sdk/src/host/history.ts#L374-L394](../../../../packages/sdk/src/host/history.ts#L374-L394) - `past`, the read"
  - "[code://packages/sdk/src/host/localturns.ts#L214-L223](../../../../packages/sdk/src/host/localturns.ts#L214-L223) - `transcriptOf`, which puts the local turns back into a read"
---

## Objective

A session listed from its kept turns opens with those turns when no backend holds its transcript.
A turn sent to it wakes its backend under its id.

## Files

- `UPDATE: packages/sdk/src/host/history.ts:374-394` - `past` answers the kept turns of the default chat when the backend's read answers nothing and the session keeps turns.
- `UPDATE: packages/sdk/test/host-local-turns.test.ts` - the opening and a turn after it.

## Steps

1. Write the tests first, and see each fail on main.
2. In `past`, when the read answers nothing and `keptTurnsOf` holds a turn, answer `withLocalTurns` over no turns.
3. Set this task and the plan's Tasks table to `done`.

## Validation

- `host-local-turns.test.ts`: after a restart, the chat opens with its `!` turns.
- `host-local-turns.test.ts`: a turn sent after the restart runs after them.

## Resume
