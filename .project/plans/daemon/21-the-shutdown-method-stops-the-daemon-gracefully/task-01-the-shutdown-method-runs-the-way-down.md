---
title: The shutdown method runs the way down
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/run.ts#L788-L798](../../../../packages/server/src/commands/run.ts#L788-L798) - `diagnostics.shutdown`, the line that changes"
  - "[code://packages/server/src/commands/run.ts#L1201-L1203](../../../../packages/server/src/commands/run.ts#L1201-L1203) - the control pipe, which already calls `way.shutdown`"
  - "[code://packages/sdk/test/diagnostics.test.ts](../../../../packages/sdk/test/diagnostics.test.ts) - the existing cases for the `shutdown` method"
---

## Objective

`diagnostics.shutdown` calls `way.shutdown()` and sends no signal, so a `shutdown` request stops the daemon gracefully on Windows too.

## Files

- `UPDATE: packages/server/src/commands/run.ts:788-798` - `diagnostics.shutdown` calls the lifecycle's `shutdown`; the comment says so.
- `UPDATE: packages/server/src/commands/run.ts:1110-1149` - after `way` is made, the shutdown that `diagnostics` calls is bound to it.
- `CREATE: packages/server/test/shutdown-method.test.ts` - the cases below.

## Steps

1. Read the plan's *Decisions locked in* row.
2. Declare a `let` holder for the shutdown before `diagnostics`, and set it to `way.shutdown` after the line that makes `way`.
3. Make `diagnostics.shutdown` call that holder, and send no signal.
4. When the holder is not set yet, keep today's `SIGTERM` to the daemon's own process.
5. Update the comment on `diagnostics.shutdown` to say it runs the same way down as `ahpd stop`.
6. Update the comment at `packages/sdk/src/host/admission.ts:184` that says `shutdown` is `SIGTERM`.
7. Add the test cases below, with the smallest seam that reaches `runForeground` or the holder.

## Validation

- `shutdown-method.test.ts`: a `shutdown` request on a running daemon raises `stopping` before the exit.
- `shutdown-method.test.ts`: a `shutdown` request sends no signal to the daemon's own process.
- `diagnostics.test.ts`: the existing `shutdown` cases still pass.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

