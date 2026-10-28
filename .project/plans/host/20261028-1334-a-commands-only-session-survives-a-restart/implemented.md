---
title: A session that holds only its own commands' turns survives a restart - implemented
date: 2026-10-28
refs:
  - git://1294e759
  - "[code://packages/sdk/src/host/localturns.ts](../../../../packages/sdk/src/host/localturns.ts)"
  - "[code://packages/sdk/src/host/catalogue.ts](../../../../packages/sdk/src/host/catalogue.ts)"
---

A session that ran only `!` commands is listed after a restart and opens with its commands' turns and their terminals.
The pruning rule keeps its text, and its reason now covers the rows the host can open from the turns it keeps.

## What was built

- [`code://packages/sdk/src/host/localturns.ts`](../../../../packages/sdk/src/host/localturns.ts) - `keptTurnsOf`, every turn a session's chats keep, and `transcriptOf` answers a chat's kept turns when its backend holds no transcript.
- [`code://packages/sdk/src/host/catalogue.ts`](../../../../packages/sdk/src/host/catalogue.ts) - `gone` keeps a session that keeps turns, and the listing names it from them with `keptRow`.
- The spec's pruning scenario and the local-turn paragraph of `TERMINALS.md` say so.

## Verified

- `host-local-turns.test.ts`: the listing and the opening cases failed on main, as an unlisted row and -32001, and pass.
- `host-local-turns.test.ts`: a session that ran nothing is pruned after a restart, before and after.
- Checks at one worker: boundary, typecheck, build and schema pass; sdk 3674 passed and 2 skipped; agent-claude 400 of 400.
- A local daemon with a real CLI, 2026-10-28: after a restart, two reads listed and opened a session of two `!` commands.
- On that daemon, a `!` turn sent after the restart woke the session and ran as its third turn.

## Departures from the plan

- Task 02 answers the kept turns in `transcriptOf` rather than in `past`, so every read of a chat answers them, a woken peer chat included.

## Left for later

- A local turn anchored to an agent turn that wrote nothing is dropped as an orphan, and the session opens without it.
