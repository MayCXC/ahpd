---
title: A turn started on a busy chat is refused
status: todo
depends: []
layer: "sdk, agent-claude, agent-acp, agent-cofold, agent-pi"
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L984-L1050](../../../../packages/sdk/src/host/lifecycle.ts#L984-L1050) - `beginOrRun`"
  - "[code://packages/agent-claude/src/session/turns.ts#L194-L206](../../../../packages/agent-claude/src/session/turns.ts#L194-L206) - `beginTurn`"
---

## Objective

The host refuses a new client turn while a turn runs, and no backend's `begin` replaces a running turn.

## Files

- `UPDATE: packages/sdk/src/host/lifecycle.ts:984-1050` - in `beginOrRun`, when `queuedAs` is undefined and `chatState()` has an active turn, return "A turn is running in this chat".
- `UPDATE: packages/agent-claude/src/session/turns.ts:124-206` - `beginTurn` refuses while `busy()`, and leaves `ctx.active` as it is.
- `UPDATE: packages/agent-acp/src/session.ts` - the same refusal in `begin`, if `begin` can replace a running turn.
- `UPDATE: packages/agent-cofold/src/session.ts` - the same refusal in `begin`, if `begin` can replace a running turn.
- `UPDATE: packages/agent-pi/src/session.ts` - the same refusal in `begin`, if `begin` can replace a running turn.
- `UPDATE: packages/sdk/test` - the host cases in Validation, in the file that tests `beginOrRun`.
- `UPDATE: packages/agent-claude/test` - the backend case, in the file that tests `beginTurn`.

## Steps

1. Write the tests first.
2. Add the check to `beginOrRun`.
3. Add the refusal to `beginTurn`, and mirror the `busy()` check in `ran`.
4. Read `begin` in agent-acp, agent-cofold and agent-pi. Add the refusal where `begin` can replace a running turn.
5. Record in the Resume section which backends needed the change.

## Validation

- A test: the host rejects a client `chat/turnStarted` on a busy chat with the sentence.
- The same test: the running turn keeps its id and parts.
- A test: a queued message starts its turn when the running turn ends.
- A test: an automation on an idle chat starts its turn as before.
- A test: agent-claude `begin` while busy leaves `ctx.active` and `ctx.turns` unchanged.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Not started.
