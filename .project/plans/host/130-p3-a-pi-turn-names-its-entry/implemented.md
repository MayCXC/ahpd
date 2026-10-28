---
title: A pi turn names the entry that holds it - implemented
date: 2026-10-27
refs:
  - "[code://packages/agent-pi/src/backend.ts](../../../../packages/agent-pi/src/backend.ts)"
  - "[code://packages/agent-pi/src/session.ts](../../../../packages/agent-pi/src/session.ts)"
  - "[code://packages/agent-pi/test/agent-pi.test.ts](../../../../packages/agent-pi/test/agent-pi.test.ts)"
  - "[code://packages/agent-pi/test/agent-pi-disk.test.ts](../../../../packages/agent-pi/test/agent-pi-disk.test.ts)"
---

When a pi turn settles, it tells the host the entry of pi's file that holds its prompt.
That entry's id is the id the turn has when it is read back.

## What was built

- [`code://packages/agent-pi/src/backend.ts`](../../../../packages/agent-pi/src/backend.ts) - `promptOf`, the first user message on a branch after an entry, and the port's `promptAfter`, which reads `SessionManager.getBranch`.
- [`code://packages/agent-pi/src/session.ts`](../../../../packages/agent-pi/src/session.ts) - a turn keeps the leaf before its prompt, and at `agent_settled` calls `onTurnRecorded` with its prompt's entry.

## Verified

- `packages/agent-pi/test/agent-pi.test.ts`: a settled turn names the prompt after the leaf it began on.
  A turn with no prompt entry names none, and the first case fails on the code before this plan.
- `packages/agent-pi/test/agent-pi-disk.test.ts`: on a file pi's own manager wrote, `promptOf` finds each turn's prompt, and `replay.ts` reads the turns back under those ids.
- The agent-pi suite passes, 216 cases.

## Departures from the plan

- The three suites that build a backend of their own gained `promptAfter`, and the lazy suite's session manager gained `getBranch`.

## Left for later

- None.
