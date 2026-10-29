---
title: The backend cases give a slow runner room - implemented
date: 2026-10-29
refs:
  - "[code://packages/server/test/daemon-backend.test.ts#L57](../../../../packages/server/test/daemon-backend.test.ts#L57) - the wait"
---

`daemon-backend.test.ts` waits 15000 ms for a daemon to end on its own before it stops it, the wait `cli.ts` gives a daemon, and each of its cases may take 60000 ms, as a case that starts a daemon does.
A daemon that starts slowly on a loaded machine runs to its own end. One that never ends still fails its case on an assertion.

## What was built

- [`code://packages/server/test/daemon-backend.test.ts`](../../../../packages/server/test/daemon-backend.test.ts) - the wait in `run`, and the timeout of every case.

## Verified

- No reference to anything the change removed is left in the tree.
- On a machine loaded to 10 on eight cores, 5 of the 7 cases ran past the 15000 ms wait, as the suite's other 15000 ms waits do under such load. The file and the suite run on a quiet machine before this is offered upstream.

## Departures from the plan

- none.

## Left for later

- none.
