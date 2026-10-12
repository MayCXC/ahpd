---
title: A spawn failure names its cause, not a path
status: todo
depends: []
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L687-L691](../../../../packages/agent-claude/src/session/query.ts#L687-L691) - the `consume` catch, which keeps `error.message`"
  - "[code://packages/agent-claude/src/spawn.ts#L73-L80](../../../../packages/agent-claude/src/spawn.ts#L73-L80) - `settle`, which hands the failure to the SDK"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.278 - a spawn failure is an error with `code` and `errorClass`
---

## Objective

A CLI that could not start fails the turn with "Claude Code process could not start", and the errno code when there is one.
The message names no path on the host.

## Files

- `CREATE: packages/agent-claude/src/session/failure.ts` - `failureOf`, which gives the message a person reads for an error from the SDK.
- `UPDATE: packages/agent-claude/src/session/query.ts:687-691` - use `failureOf` for `ctx.failed`.
- `UPDATE: packages/agent-claude/src/spawn.ts:73-80` - give the SDK an error that `failureOf` reads the same way.
- `CREATE: packages/agent-claude/test/agent-claude-spawn-failure.test.ts` - the cases below.

## Steps

1. Read `errorClass` and `code` from the error in `failureOf`.
2. Return "Claude Code process could not start" for `executable_not_found`, `executable_launch_failed` and `spawn_failed`.
3. Add the errno code in brackets when the error has one, as in "(ENOENT)".
4. Return `error.message` for every other error, as now.
5. Set `ctx.failed` from `failureOf` in the `consume` catch.
6. Keep `code` on the error that `settle` passes on, so `failureOf` can read it.

## Validation

- With the real SDK, a hook that runs a missing binary fails the turn with the short message and `(ENOENT)`.
- That message has no `/` in it.
- An error with no `errorClass` keeps its own message.
- `pnpm exec vitest run packages/agent-claude` passes.

## Resume
