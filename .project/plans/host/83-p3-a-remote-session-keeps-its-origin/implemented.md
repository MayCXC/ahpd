---
title: A remote session is taken and keeps its origin - implemented
date: 2026-10-11
refs:
  - git://58463c7
  - "[code://packages/sdk/src/sessions/remotesession.ts](../../../../packages/sdk/src/sessions/remotesession.ts)"
  - "[code://packages/sdk/src/host/tooling.ts](../../../../packages/sdk/src/host/tooling.ts)"
  - "[code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts)"
---

VS Code's window can send a session to ahpd. The session keeps its origin, the session that made it and its depth, and all three survive a restart. The Claude agent is told to report back to the chat that sent the work. It is told on each turn where a client in the session offers `send_remote_message`.

## What was built

- [`code://packages/sdk/src/sessions/remotesession.ts`](../../../../packages/sdk/src/sessions/remotesession.ts) - the keys, and the readers that drop a malformed origin.
- [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - `createSession` keeps the origin and the creator, and every turn gets its instructions.
- [`code://packages/sdk/src/sessions/sessions.ts`](../../../../packages/sdk/src/sessions/sessions.ts) - the store keeps both, and the summary carries them.
- [`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts) - `turnInstructions`, which gives the `<remote_session_origin>` text, word for word.
- [`code://packages/sdk/src/types/session.ts`](../../../../packages/sdk/src/types/session.ts) - `TurnOptions` on `begin` and `queue`.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - a `UserPromptSubmit` hook gives the turn's instructions as additional context.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude`: 4013 of 4013 tests pass after the rebase onto main.
- `host-remote-session.test.ts` is new. It covers a client that joins or leaves between turns.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- The check by hand, by Softov on 2026-10-16, on Windows with VS Code 1.141.2, after the fix below: a local chat sent a task to ahpd, the session opened there with its origin, the agent called `send_remote_message` with session `origin`, and the answer came back to the local chat.

## Departures from the plan

- Task 02 also puts the creating client in the session before `openSession`, with a rollback if it throws. This is the fix that claude/21 task 03 plans.
- Task 01 read the origin from `createSession` `config._meta`, but VS Code 1.141 sends it on the request's own `_meta`, beside an empty `config`.
  The check by hand on 2026-10-16 found the origin dropped and no report back.
  `configOf` in [`code://packages/sdk/src/sessions/remotesession.ts`](../../../../packages/sdk/src/sessions/remotesession.ts) now moves the origin and the creator from the request's `_meta` into the config, and `createSession` opens the session with it.

## Left for later

- The per-turn instruction in ACP, cofold and pi - see [deferred.md](deferred.md).
