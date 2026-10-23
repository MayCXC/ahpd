---
title: A nested chat hands on an older inner host's 50-turn cut
status: open
date: 2026-10-22
severity: minor
refs:
  - "[code://packages/sdk/src/sessions/nested.ts#L951](../../packages/sdk/src/sessions/nested.ts#L951) - `allTurns()` of a nested chat is the turns the inner host sent"
  - "[code://packages/sdk/src/sessions/nested.ts#L981](../../packages/sdk/src/sessions/nested.ts#L981) - `chatState()` of a nested chat gives the inner host's state, with its `turnsNextCursor`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L449-L462](../../packages/sdk/src/host/sessionmethods.ts#L449-L462) - `fetchTurns` pages from the outer host's own copy of the turns"
  - "[code://packages/sdk/src/sessions/paging.ts#L47-L56](../../packages/sdk/src/sessions/paging.ts#L47-L56) - `older` refuses a cursor past the end of the turns it has"
---

## Symptom

A session runs inside a machine on an inner host that is older than host/114.
The outer host subscribes to the inner chat with no view, and the inner host sends only its newest 50 turns and a cursor.
The outer host gives that state to its own clients, so they also see 50 turns and the inner cursor.
A client that sends `fetchTurns` with that cursor gets the outer host's answer, not the inner host's.
Found while drafting host/114, 2026-10-22, by reading the code. Not seen in a running daemon.

## Cause

- The nested chat keeps only the turns the inner host sent, and `allTurns()` gives those.
- The inner cursor is the index of the oldest turn in the inner host's whole list.
- The outer `fetchTurns` reads that cursor against its own shorter list. `older` refuses an index past the end, and gives the wrong page for a smaller one.

## Impact

A client of the outer host cannot load the older turns of a nested chat when the inner host is older.
When both hosts have host/114, the inner host sends every turn and no cursor, so nothing is lost.

## Workaround

Update the inner host to a build with host/114.

## Fix

- Send `fetchTurns` for a nested chat on to the inner host, and let its `chat/turnsLoaded` reach the outer clients.
