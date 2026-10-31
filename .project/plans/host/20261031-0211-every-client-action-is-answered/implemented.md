---
title: Every client action is answered - implemented
date: 2026-10-31
refs:
  - git://36d7eaac
  - "[code://packages/sdk/src/host/chatactions.ts](../../../../packages/sdk/src/host/chatactions.ts)"
  - "[code://packages/sdk/src/host/actions.ts](../../../../packages/sdk/src/host/actions.ts)"
---

A client that removes a pending message the chat does not hold now gets a refusal with a reason.
A client that sets a flag to its current value gets an echo to itself only.

## What was built

- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - `chat/pendingMessageRemoved` refuses an id and kind that `session.chatState()` does not hold. A chat flag that does not move is echoed to the sender.
- [`code://packages/sdk/src/host/actions.ts`](../../../../packages/sdk/src/host/actions.ts) - `session/isReadChanged` and `session/isArchivedChanged` echo to the sender when `sessionFlag` returns `false`.
- [`code://docs/sdk/AHP.md`](../../../../docs/sdk/AHP.md) - the removal row says what is refused, and "An action that changes nothing is not a change" names the four flag actions.

## Verified

- `host-input.test.ts` has two new tests: an id the chat never queued, and a queued message removed as a steering one. Both fail on the old code.
- `presence.test.ts` has a two-client test of a session flag set again. `host-snapshots.test.ts` and `host-catalogue.test.ts` now expect one echo to the sender. The changed tests fail on the old code.
- `pnpm typecheck` is clean, and `pnpm --filter @ahpd/sdk test` passes.

## Departures from the plan

- The plan named four protocol cases that become refusals, and seven did. The harness seeds no state, so cases 042, 043, 044, 048, 049, 050 and 051 all remove a message the chat does not hold. All seven are in `NOT_REPLAYED` and `HOST_REFUSED`, and the counts in `ahp-test-cases.test.ts` moved with them.
- `host-catalogue.test.ts` was not in the plan. Its test of a session marked read twice expected silence, and now expects one echo.

## Left for later

- A matching steering removal reaches the claude backend's `unqueue`, which handles only queued messages, so it still says nothing. This was not in the plan.
