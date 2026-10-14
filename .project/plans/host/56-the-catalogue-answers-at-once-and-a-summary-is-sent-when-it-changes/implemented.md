---
title: The catalogue answers at once, and a summary is sent only when it changes - implemented
date: 2026-10-13
refs:
  - "[code://packages/sdk/src/host/catalogue.ts](../../../../packages/sdk/src/host/catalogue.ts)"
---

`listSessions` answers from a held catalogue in milliseconds, and a `root/sessionSummaryChanged` goes out only when the summary changed. A build session no longer floods every client with copies of the last summary.

## What was built

- Task 01: a summary equal to the last one for that session is not sent.
- Task 02: the catalogue asks every agent at once, and Claude's variants of one load share one listing per store.
- Task 03: the catalogue is held, and a background refresh sends only what moved.
- Task 04: opening a past session reads the held row and asks the backend for one id.
- The review findings were fixed in host 64.

## Verified

- This machine, 2026-10-09: `listSessions` went from a 30 s timeout to 19 ms, and the summary events from about 28 a second to about 0.26 a second. RSS went from 3.1-3.7 GB to 320-600 MB.
- dev-01, 2026-10-13: `listSessions` went from 48.6 s to 21 ms. With two builds running, 23 summary events came in 70 s, and at most 4 were the same as the one before.
- The numbers are in [task 05](task-05-measured-before-and-after.md).

## Departures from the plan

- none.

## Left for later

- none.
