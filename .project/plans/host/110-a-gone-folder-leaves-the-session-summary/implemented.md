---
title: A gone folder leaves the session summary - implemented
date: 2026-10-19
refs:
  - git://1d9a39b8
  - "[code://packages/sdk/src/host/catalogue.ts](../../../../packages/sdk/src/host/catalogue.ts)"
  - "[code://docs/sdk/SESSIONS.md](../../../../docs/sdk/SESSIONS.md)"
---

A session keeps its row after its folder is removed outside ahpd, and its summary names no folder that is not there.
A client that draws its folder list from session summaries shows no gone folder, with no change in the client.
When the folder comes back, the next listing names it again.
The store record keeps every folder, so nothing is lost.

## What was built

- [`code://packages/sdk/src/host/catalogue.ts`](../../../../packages/sdk/src/host/catalogue.ts) - `directoriesThere` keeps a URI that is not `file:` and a `file:` URI whose path is a directory. `summaryOf`, `adopt` and `liveRows` pass `workingDirectories` through it.
- [`code://docs/sdk/SESSIONS.md`](../../../../docs/sdk/SESSIONS.md) - one sentence: a summary leaves out a `file:` folder that is not a directory on this host.

## Verified

- `packages/sdk/test/catalogue-gone-folder.test.ts`: four cases, `leaves the summary, and stays in the record and the opened session`, `is named again after it is made again`, `keeps a URI that names another machine` and `leaves a running session's summary too`.
- The gates passed: build, typecheck, boundary and schema. The sdk suite had 3232 passed and 2 skipped, and the server suite had 1236 passed.
- Softov reviewed the plan on 2026-10-19 and approved the close.

## Departures from the plan

- `liveRows` passes the folders through the filter too, beside the two callers that the task named.
- A check that throws keeps the folder, because the host cannot say that the folder is gone.

## Left for later

- Nothing.
