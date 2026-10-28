---
title: A Claude turn read back is a point to fork and cut at - implemented
date: 2026-10-28
refs:
  - git://823fed44
  - "[code://packages/sdk/src/host/sessionmethods.ts](../../../../packages/sdk/src/host/sessionmethods.ts)"
  - "[code://packages/agent-claude/src/transcript.ts](../../../../packages/agent-claude/src/transcript.ts)"
  - "[code://packages/agent-claude/src/claude.ts](../../../../packages/agent-claude/src/claude.ts)"
---

After a restart, a client forks or rewinds a Claude chat at any turn that the host read back from its transcript.
A fork of a chat in a sleeping session wakes the session first, as every other action on one does.

## What was built

- [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts) - `createChat` holds a session asleep in the catalogue, wakes it and makes the call again on the live session.
- [`code://packages/agent-claude/src/transcript.ts`](../../../../packages/agent-claude/src/transcript.ts) - `turnsOf` fills a map with each turn's last prompt, tool result or answer entry.
- [`code://packages/agent-claude/src/claude.ts`](../../../../packages/agent-claude/src/claude.ts) - `transcript` keeps that map by conversation, and `create` gives it to a session that resumes the conversation without a fork.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - `ends` starts from `seedEnds`.
- The Session contract, `CHATS.md`, `AHP.md`, `SESSIONS.md` and the spec say when a turn read back is a point.

## Verified

- `session-wake.test.ts`: a fork and a new chat in a sleeping session wake it; both answered -32001 on main.
- `host-local-turns.test.ts`: a fork after a restart at a `!` turn cuts at the end of the Claude turn read back before it. With the wake alone it answered -32602.
- `agent-claude-read-ends.test.ts`: four cases; the two that name read ends failed on main, and the fork and no-read cases guard the edges.
- Checks at one worker: boundary, typecheck, build and schema pass; agent-claude 404 of 404; sdk 3666 passed and 2 skipped.
- A local daemon with a real CLI, 2026-10-28: after a restart, a fork at the sleeping session's last `!` turn opened and answered "pong".
- After another restart, a rewind of the sleeping chat to its model turn dropped the `!` turn after it, and the next turn answered "pong".

## Departures from the plan

- none.

## Left for later

- A pi session reads its own file after `create` returns, so a fork asked at the moment of its wake is refused.
- A cofold or ACP turn read back has no point, because those backends name points only for the turns that they watch.
