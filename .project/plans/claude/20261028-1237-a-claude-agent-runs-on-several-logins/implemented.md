---
title: A Claude agent runs on several logins - implemented
date: 2026-10-28
refs:
  - "[code://packages/agent-claude/src/logins.ts](../../../../packages/agent-claude/src/logins.ts)"
  - "[code://packages/agent-claude/src/session/logins.ts](../../../../packages/agent-claude/src/session/logins.ts)"
  - "[code://packages/agent-claude/test/agent-claude-logins.test.ts](../../../../packages/agent-claude/test/agent-claude-logins.test.ts)"
---

A Claude record holds `logins`, each a token from `claude setup-token`.
Each conversation runs on its own login, ordered by a rendezvous score, and keeps it while the login works.
A login the API refuses for its quota or its billing cools down for every session of the agent.
A refused turn that showed nothing runs again on the next login.
It is cut back to the turn before it, or started over when it was the first.
When every login cools down, the turn waits for the earliest one.

## What was built

- [`code://packages/agent-claude/src/logins.ts`](../../../../packages/agent-claude/src/logins.ts) - a record's logins, a conversation's order, `cooldownUntil` and `Cooldowns`.
- [`code://packages/agent-claude/src/session/logins.ts`](../../../../packages/agent-claude/src/session/logins.ts) - the session's login, the refusal, the cut point, the move, the wait and its stop.
  `replacing` names the CLI that a move closed, until the next CLI is in its place.
- [`code://packages/agent-claude/src/options.ts`](../../../../packages/agent-claude/src/options.ts) - the declared `logins` field, its token write-only as a model source's `key`.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - the token in the CLI's environment, under a pushed credential.
  `refreshPreset` restarts on a new login, a query resumes at a cut, and the refusal frames reach the area.
  `failTurn` ends the running turn as failed and leaves the session as it is; `died` adds the session's end to it.
  The frames of a CLI that a move closed end without a word.
- [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts) - `again`, the running turn's prompt sent once more under a new uuid; `cancel` stops a move.
- [`code://packages/agent-claude/src/claude.ts`](../../../../packages/agent-claude/src/claude.ts) - one `Cooldowns` for every session of an agent.

## Verified

- A real CLI on SDK 0.3.301 against a local stub gave the frames that the cases feed.
  It also showed that a prompt sent again with no cut reaches the model twice.
- `packages/agent-claude/test/agent-claude-logins.test.ts`: 19 cases.
  Six of task 01's seven fail on the code before it; the seventh keeps today's behaviour for a record with no `logins`.
  Ten of task 02's twelve fail on task 01's code.
  The case of a refused sign-in keeps today's behaviour there.
  The case of a session closed during a wait passes there because nothing waits, and fails without the stop in `close`.
- Three cases fail without one part of task 02's code each:
  - with the session's end cleared before the delete, the turn after a start-over fails with `The agent stopped`;
  - without the mark of the closed CLI, a CLI that raises as it ends fails the refused turn;
  - without the resume after a failed delete, a fresh CLI starts under an id that the real CLI refuses as in use.
- The agent-claude suite passes at one worker, 419 cases, and the sdk suite passes, 3677 cases with 2 skipped.
  Boundary, typecheck, build and schema pass.

## Departures from the plan

- A conversation refused on its first turn starts over under its id, as the plan it requires gives a chat truncated whole.
- A turn after one read back from a transcript fails rather than moving, until the backend records that turn's end at the transcript read.
- A conversation whose delete fails comes back as it was, on the next login, and its turn fails with the refusal.

## Left for later

- None.
