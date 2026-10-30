---
title: A dispatch that throws is refused - implemented
date: 2026-10-30
refs:
  - git://0a0542c1 - the change
  - "[code://packages/sdk/src/host.ts#L1709-L1723](../../../../packages/sdk/src/host.ts#L1709-L1723) - `refuseFailed` logs a dispatch whose apply failed and refuses it to its sender"
  - "[code://packages/sdk/src/host.ts#L1764-L1795](../../../../packages/sdk/src/host.ts#L1764-L1795) - `dispatchAction` refuses a throw from an apply made at once through `refuseFailed`"
---

A client action whose apply throws is refused to the client that sent it, with the error's message as its `rejectionReason`.
This holds for a dispatch applied at once and for one that waited behind another, and the daemon's log names the failure in both cases.

## What was built

- [`code://packages/sdk/src/host.ts#L1709-L1739`](../../../../packages/sdk/src/host.ts#L1709-L1739) - `refuseFailed` holds the log line and the refusal that `behind`'s catch gave, and `behind` calls it.
- [`code://packages/sdk/src/host.ts#L1764-L1795`](../../../../packages/sdk/src/host.ts#L1764-L1795) - `dispatchAction` catches a throw from `applyNow` and refuses the action through `refuseFailed`. A dispatch that applies does so in the tick it arrived in, and one that throws puts nothing in `waiting`.
- [`code://packages/sdk/test/automations.test.ts#L1739-L1794`](../../../../packages/sdk/test/automations.test.ts#L1739-L1794) - "refuses a write the store throws on, in a frame to the client that sent it". The case sends a pinned automation set to run in parallel through `receive`, and reads the refusal frame, the empty store and the log line.
- [`code://packages/sdk/test/automations.test.ts#L1700-L1737`](../../../../packages/sdk/test/automations.test.ts#L1700-L1737) - "refuses a signed-in client's patch that names another person's agent, on an automation nobody owns" reads the refusal off the client's peer.

## Verified

- Against the host before the change, the new case fails with "expected [] to deeply equal [ { …(5) } ]": the wire carried no refusal. With the change it passes.
- `automations.test.ts` passes (62 tests), and so does `session-fixed-key.test.ts` (17 tests), which holds the refusal of a throw in a dispatch that waited.
- The type check passes.
- No other test file ran.

## Departures from the plan

- none.

## Left for later

- none.
