---
title: The ACP bridge resumes, forks and asks - implemented
date: 2026-10-10
refs:
  - git://b6fdc86
  - "[code://packages/agent-acp/src/session/opening.ts](../../../../packages/agent-acp/src/session/opening.ts)"
  - "[code://packages/agent-acp/src/session/handlers.ts](../../../../packages/agent-acp/src/session/handlers.ts)"
  - "[code://packages/sdk/src/types/session.ts](../../../../packages/sdk/src/types/session.ts)"
---

A session on an ACP server resumes without a replay when the server can, and loads it otherwise.
A client can fork the last turn of a session whose server advertises `session.fork`.
A reopen after the server died continues the forked copy, and does not fork again.
A server's `elicitation/create` is an input request in the chat, and the person's accept, decline or cancel reaches the server as it was sent.
A server that offers only `session.resume` is resumable.

## What was built

- [`code://packages/agent-acp/src/session/opening.ts`](../../../../packages/agent-acp/src/session/opening.ts) - `open()` chooses fork, resume or load, and a reopen after a death continues the session's own id.
- [`code://packages/agent-acp/src/session/handlers.ts`](../../../../packages/agent-acp/src/session/handlers.ts) - `askElicitation`, `heardElicitationComplete`, `answerElicitation` and `settleElicitations`.
- [`code://packages/agent-acp/src/connection.ts`](../../../../packages/agent-acp/src/connection.ts) - `resumeSession`, `forkSession` and the elicitation handlers, and the `elicitation` capability.
- [`code://packages/agent-acp/src/session.ts`](../../../../packages/agent-acp/src/session.ts) - `forkPoint` for the last turn, and `resumable()` from `ctx.loads || ctx.resumes`.
- [`code://packages/agent-acp/src/mapping.ts`](../../../../packages/agent-acp/src/mapping.ts) - a form's fields to questions, and the answers back.
- [`code://packages/sdk/src/types/session.ts`](../../../../packages/sdk/src/types/session.ts) - `Session.answer` takes an optional response kind.
- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - the host passes the client's response kind to the backend.
- [`code://docs/plugins/PLUGINS.md`](../../../../docs/plugins/PLUGINS.md) and [`code://packages/agent-acp/README.md`](../../../../packages/agent-acp/README.md) - the resume, the fork and the question.

## Verified

- `pnpm exec vitest run packages/agent-acp packages/sdk/test/host-chats.test.ts`: 16 files, 283 tests green on `b6fdc86`.
- `pnpm typecheck` and `pnpm boundary` green on `b6fdc86`.
- No run against a real ACP server; every case uses `packages/agent-acp/test/fixtures/acp-server.mjs`.

## Departures from the plan

- The plan said no SDK change. Task 05 changes `Session.answer`, from Softov's answer of 2026-10-10.
- The review found that a reopen after a fork resumed the original conversation. The fix is in `7dc2a70`, with a test.
- A form field of a type ACP does not name is asked as text, and task 06 added a test for it.

## Left for later

- ACP v2 - see [deferred.md](deferred.md).
