---
title: An unchanged client set is echoed back - implemented
date: 2026-10-16
refs:
  - git://c5b4e7b6
  - "[code://packages/sdk/src/host.ts](../../../../packages/sdk/src/host.ts)"
  - "[code://packages/sdk/src/host/actions.ts](../../../../packages/sdk/src/host/actions.ts)"
  - "[code://packages/sdk/src/host/chatactions.ts](../../../../packages/sdk/src/host/chatactions.ts)"
---

A client that sends an unchanged `session/activeClientSet`, or a `chat/turnCancelled` that stops nothing, gets its action back with its `origin`. Only the sender gets this echo, so the other clients see nothing and the loop of round trips does not start again.

## What was built

- [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - `echoTo`, beside `refuse`, sends one accepted action to one peer at the current `serverSeq`, with no replay entry.
- [`code://packages/sdk/src/host/actions.ts`](../../../../packages/sdk/src/host/actions.ts) - the guard on an unchanged set echoes to the sender.
- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - a cancel on a lead chat with no running turn, or with a different running turn, echoes to the sender.
- [`code://docs/sdk/AHP.md`](../../../../docs/sdk/AHP.md) - when an action is echoed and to whom.

## Verified

- `presence.test.ts`, `host-catalogue.test.ts` and `usage-meter.test.ts`. The full vitest run had 289 files and 5173 tests, and all passed.

## Departures from the plan

- Task 03 - a cancel that names no turn still stops the running turn, because `notes.test.ts` and both example backends rely on it.

## Left for later

- None.
