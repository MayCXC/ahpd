---
title: A turn is refused while one runs - implemented
date: 2026-10-16
refs:
  - git://5fec89c1
  - "[code://packages/sdk/src/host/lifecycle.ts](../../../../packages/sdk/src/host/lifecycle.ts)"
  - "[code://packages/agent-claude/src/session/turns.ts](../../../../packages/agent-claude/src/session/turns.ts)"
---

A client that starts a turn while another turn runs gets the refusal "A turn is running in this chat".
The running turn stays in the history of every client, with its id and its parts.

## What was built

- [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - `beginOrRun` refuses a turn when `chatState().activeTurn` is set, in `5fec89c1`. A queued message and a `!command` on a host with terminals are exempt, so the queue keeps moving.
- [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts) - `beginTurn` returns at once when `busy()` holds, so a turn that reaches it cannot replace `ctx.active`.
- [`code://packages/sdk/test/host-turn.test.ts`](../../../../packages/sdk/test/host-turn.test.ts) - two cases: a refused turn leaves the running turn whole, and the next turn starts after the running turn ends.
- [`code://packages/agent-claude/test/agent-claude-turn-recorded.test.ts`](../../../../packages/agent-claude/test/agent-claude-turn-recorded.test.ts) - a second `begin` leaves `ctx.active` and `ctx.turns` as they were.

## Verified

- `pnpm typecheck`, `pnpm boundary` and `pnpm schema` exit 0.
- Vitest on sdk, server, agent-claude and agent-acp passes: 244 files and 4402 tests. Each package also passes alone.
- The queued message case is the existing `host-input.test.ts` case, and it passes unchanged.

## Departures from the plan

- agent-acp, agent-cofold and agent-pi needed no change, because their `begin` already keeps a running turn. They got no new test, so the checklist line on a test per backend stays open.
- Three agent-claude and server tests started a turn on a running one. They now end the running turn first.

## Left for later

- A test per backend for agent-acp, agent-cofold and agent-pi - see [deferred.md](deferred.md).
