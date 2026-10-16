---
title: Every automation due at once fires - implemented
date: 2026-10-16
refs:
  - git://b0fad1a0
  - "[code://packages/server/src/scheduled.ts](../../../../packages/server/src/scheduled.ts)"
  - "[code://packages/server/test/scheduled.test.ts](../../../../packages/server/test/scheduled.test.ts)"
---

Two automations that are due at the same minute both fire.
A run that the first automation starts can no longer move the second one to its next occurrence before it fires.

## What was built

- [`code://packages/server/src/scheduled.ts`](../../../../packages/server/src/scheduled.ts) - `fire` builds a list of every due automation, with its time and origin, before it calls a `due` listener. It then announces each entry and calls `rearm` once, in `b0fad1a0`.
- [`code://packages/server/test/scheduled.test.ts`](../../../../packages/server/test/scheduled.test.ts) - two cases with two automations on one schedule. In the second case, a `due` listener runs each automation as the host does, and this case fails against the old `fire`.

## Verified

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0. The schema is unchanged.
- Vitest on sdk, server, agent-claude and agent-acp passes: 241 files and 4343 tests. `scheduled.test.ts` has 31 tests, and two of them are new.
- The check by hand with a running daemon waits in [linux-checks.md](../../../pending/linux-checks.md).

## Departures from the plan

- none.

## Left for later

- none.
