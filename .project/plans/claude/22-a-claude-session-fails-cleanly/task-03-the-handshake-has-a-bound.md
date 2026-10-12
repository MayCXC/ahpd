---
title: The CLI's handshake has a bound
status: todo
depends: [task-02-a-spawn-failure-names-its-cause.md]
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L142](../../../../packages/agent-claude/src/session/query.ts#L142) - `startQuery`"
  - "[code://packages/agent-claude/src/session/query.ts#L402-L415](../../../../packages/agent-claude/src/session/query.ts#L402-L415) - `switchAgent`, which also starts a query"
  - "[code://packages/agent-claude/src/session/query.ts#L687-L715](../../../../packages/agent-claude/src/session/query.ts#L687-L715) - the `consume` catch, the path a dead CLI takes"
  - "[code://packages/agent-claude/src/plugin.ts#L38-L58](../../../../packages/agent-claude/src/plugin.ts#L38-L58) - the plugin options"
  - "[code://packages/agent-claude/src/session/context.ts#L38](../../../../packages/agent-claude/src/session/context.ts#L38) - `clientToolTimeoutMs`, the pattern for a bound in the session options"
---

## Objective

A CLI that has not answered `initializationResult` 120 seconds after its query starts is treated as a CLI that died.
The active turn fails with a message that says so, and the query is closed.

## Files

- `UPDATE: packages/agent-claude/src/plugin.ts:38-58` - the option `handshakeTimeoutMs`, 120000 by default.
- `UPDATE: packages/agent-claude/src/session/context.ts:38` - `handshakeTimeoutMs` in the session options.
- `UPDATE: packages/agent-claude/src/claude.ts:616` - pass the option to the session.
- `UPDATE: packages/agent-claude/src/session/query.ts:142` - start the bound each time a query starts.
- `UPDATE: packages/agent-claude/src/session/query.ts:687-715` - share the code that fails the active turn with the bound.
- `CREATE: packages/agent-claude/test/agent-claude-handshake.test.ts` - the cases below.

## Steps

1. Add `handshakeTimeoutMs` to the plugin options, with 120000 as the default.
2. Pass it from the plugin options to the session options in `claude.ts`.
3. Start a timer when a query starts, at creation and in `switchAgent`.
4. Clear the timer when `initializationResult` resolves or rejects.
5. On timeout, do nothing if `ctx.handle` is no longer that query.
6. On timeout, set `ctx.failed` and `ctx.gone` to "Claude Code did not answer within <n> seconds".
7. Fail the active turn with the code the `consume` catch uses.
8. Close the query.

## Validation

- A fake query whose `initializationResult` never resolves fails the turn after the bound.
- A query that answers in time keeps its turn.
- A query replaced before the bound is not failed.
- `pnpm exec vitest run packages/agent-claude` passes.

## Resume
