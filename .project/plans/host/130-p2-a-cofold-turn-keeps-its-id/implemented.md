---
title: A cofold turn keeps the id it was given - implemented
date: 2026-10-27
refs:
  - "[code://packages/agent-cofold/src/turns.ts](../../../../packages/agent-cofold/src/turns.ts)"
  - "[code://packages/agent-cofold/test/agent-cofold-store.test.ts](../../../../packages/agent-cofold/test/agent-cofold-store.test.ts)"
---

A cofold turn stores its prompt under the turn's own id, so the turn has one name before and after a restart.

## What was built

- [`code://packages/agent-cofold/src/turns.ts`](../../../../packages/agent-cofold/src/turns.ts) - `launch` passes `messageId: turnId` to `run`.

## Verified

- `packages/agent-cofold/test/agent-cofold-store.test.ts`: `transcript` reads two turns back under the ids their client gave them, and the case fails on the code before this plan.
- The agent-cofold suite passes, 243 cases.

## Departures from the plan

- `agent-cofold-tools.test.ts` began `t1` twice in one conversation on one store.
  Its second turn is now `t2`, as each turn of a chat has an id of its own.

## Left for later

- None.
