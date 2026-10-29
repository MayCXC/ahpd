---
title: A session disposed while its count is read leaves no file - implemented
date: 2026-10-29
refs:
  - git://be7fb309 - the change
  - "[code://packages/sdk/src/host/catalogue.ts#L686](../../../../packages/sdk/src/host/catalogue.ts#L686) - the count is written only for a session this host runs"
---

A disposed session leaves no file in the session store.
A count that arrives after the disposal writes nothing, so the next daemon lists no session of counts alone.

## What was built

- [`code://packages/sdk/src/host/catalogue.ts`](../../../../packages/sdk/src/host/catalogue.ts) - `summaryKept` writes a count only for a session in `sessions` or in `ctx.respawning`.
- [`code://packages/sdk/test/host-catalogue.test.ts`](../../../../packages/sdk/test/host-catalogue.test.ts) - "keeps no file for a session disposed while its counts were being read".

## Verified

- The new case fails before the change, with `live.json` left in the store, and passes after it.
- `host-catalogue.test.ts` passes, 69 of 69.

## Departures from the plan

- none.

## Left for later

- none.
