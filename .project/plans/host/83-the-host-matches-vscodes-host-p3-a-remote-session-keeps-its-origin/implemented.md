---
title: A remote session is taken and keeps its origin - implemented
date: 2026-10-11
refs:
  - git://58463c7
  - "[code://packages/sdk/src/remotesession.ts](../../../../packages/sdk/src/remotesession.ts)"
  - "[code://packages/sdk/src/host/tooling.ts](../../../../packages/sdk/src/host/tooling.ts)"
  - "[code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts)"
---

VS Code's window can send a session to ahpd. The session keeps its origin, the session that made it and its depth, and all three survive a restart. The Claude agent is told to report back to the chat that sent the work. It is told on each turn where a client in the session offers `send_remote_message`.

## What was built

- [`code://packages/sdk/src/remotesession.ts`](../../../../packages/sdk/src/remotesession.ts) - the keys, and the readers that drop a malformed origin.
- [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - `createSession` keeps the origin and the creator, and every turn gets its instructions.
- [`code://packages/sdk/src/sessions.ts`](../../../../packages/sdk/src/sessions.ts) - the store keeps both, and the summary carries them.
- [`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts) - `turnInstructions`, which gives the `<remote_session_origin>` text, word for word.
- [`code://packages/sdk/src/types/session.ts`](../../../../packages/sdk/src/types/session.ts) - `TurnOptions` on `begin` and `queue`.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - a `UserPromptSubmit` hook gives the turn's instructions as additional context.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude`: 4013 of 4013 tests pass after the rebase onto main.
- `host-remote-session.test.ts` is new. It covers a client that joins or leaves between turns.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Departures from the plan

- Task 02 also puts the creating client in the session before `openSession`, with a rollback if it throws. This is the fix that claude/21 task 03 plans.

## Left for later

- The check by hand: a session sent from VS Code's window opens on ahpd and reports back to the chat that sent it.
- The per-turn instruction in ACP, cofold and pi - see [deferred.md](deferred.md).
