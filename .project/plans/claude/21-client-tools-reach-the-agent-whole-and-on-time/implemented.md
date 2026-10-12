---
title: A client's tools reach the agent whole and on time - implemented
date: 2026-10-11
refs:
  - git://c6bd1fdf
  - "[code://packages/agent-claude/src/session/clienttools.ts](../../../../packages/agent-claude/src/session/clienttools.ts)"
  - "[code://docs/AHP.md](../../../../docs/AHP.md)"
---

A client's tool reaches Claude with its whole JSON Schema. A tool list that the SDK refused is sent again when it comes back. A handler that waits on a client that left gets a refusal at once, and does not wait until the turn stops.

## What was built

- [`code://packages/agent-claude/src/session/clienttools.ts`](../../../../packages/agent-claude/src/session/clienttools.ts) - `shaped()` reads each property with `z.fromJSONSchema`, keeps its description, and falls back to a string when zod refuses it.
- The same file - `setTools` keeps the new list only after `setMcpServers` takes it.
- The same file - `clientGone` and `refuseJoins` end each join that waits on a tool of the client that left. `openCall` does the same for a call whose tool nothing offers.
- [`code://docs/AHP.md`](../../../../docs/AHP.md) - the input request table names all four kinds.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude`: 4044 of 4045 tests pass after the rebase onto main. The one failure is `nested-start.test.ts`, which times out on main too.
- New cases: `agent-claude-contributed-schema.test.ts`, `agent-claude-contributed-tools.test.ts`, `agent-claude-client-gone.test.ts`, and two in `presence.test.ts`.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Departures from the plan

- Task 03's source change was built by host/83 p3. This plan added only its two test cases.
- Task 04 did more than its steps. Each wait in `asked` now keeps its tool name, so a client that leaves can end the waits by call id too.
- The cases of tasks 01, 02 and 04 are in `packages/agent-claude/test/`, next to the other agent-claude tests.
- The zod floor stays at `^4.4.3`, because `fromJSONSchema` is in zod 4.2.0.

## Left for later

- The check by hand: a VS Code tool with a nested object argument runs from a Claude session on the first turn.
