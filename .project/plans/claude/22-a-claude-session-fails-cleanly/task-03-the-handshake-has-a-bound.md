---
title: The CLI's handshake has a bound
status: done
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

Implemented 2026-10-11. `bounded` is put on every query `startQuery` builds, which is the one place a session starts one from: the creation in `session.ts` and the rebuild in `switchAgent` both go through it, so the timer cannot be forgotten on one of the two roads. It starts a timer of `handshakeTimeoutMs` and clears it when `initializationResult` settles, whichever way it settles.

When the timer is the one that fires, the query has to still be the one this session is reading - `ctx.handle !== handle` and nothing happens. Otherwise the session fails on the road a CLI that died takes, which is now one function, `died`, shared with the `consume` catch: the reason becomes `ctx.failed` and `ctx.gone`, the turn in flight is recorded as one that failed with an error part carrying it, and the query is closed so that a CLI answering an hour later is not a process nobody is reading.

The catch gained one thing beside the call: it returns at once when `ctx.gone` is already set. Without that the close above lands back in it - the SDK raises its own words for a socket that went away - and would replace the one sentence a person can act on with them.

A session given no `handshakeTimeoutMs` runs on the backend's own 120000. The option comes from the plugin and is one per variant: `plugin.ts` declares it, `claude()` hands it to the session beside `clientToolTimeoutMs`, and a preset holds none.

The message spells the bound in seconds out of the milliseconds it was given, so the backend's own reads "within 120 seconds" and a test's short bound reads "within 0.025 seconds".

Files changed, uncommitted:

- `UPDATE: packages/agent-claude/src/session/query.ts` - `HANDSHAKE_MS`, `died`, `bounded`, the bound on `startQuery`, and the catch's use of both.
- `UPDATE: packages/agent-claude/src/plugin.ts` - the `handshakeTimeoutMs` option, and into what every variant of one load shares.
- `UPDATE: packages/agent-claude/src/claude.ts` - `ClaudeOptions.handshakeTimeoutMs`, and the session option passed at the `createSession` call. The interface field is not in this task's Files list; without it `plugin.ts` cannot read the value its schema declares.
- `UPDATE: packages/agent-claude/src/session/context.ts` - `handshakeTimeoutMs` in the session options, beside `clientToolTimeoutMs`.
- `UPDATE: packages/agent-claude/README.md` - the options table row and a sentence in the paragraph under it. Also not in the Files list: `agent-claude-options.test.ts` holds the schema to that table, so a declared option the README does not list fails the suite.
- `CREATE: packages/agent-claude/test/agent-claude-handshake.test.ts` - four cases: a handshake that never answers, one that answers in time, a query replaced before its bound, and the plugin option reaching the session.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/agent-claude` pass - 29 files, 279 cases. `packages/computer/test/computer-spawn.test.ts`, which runs real sessions through this backend, passes with `--maxWorkers=2 --testTimeout=10000`.
