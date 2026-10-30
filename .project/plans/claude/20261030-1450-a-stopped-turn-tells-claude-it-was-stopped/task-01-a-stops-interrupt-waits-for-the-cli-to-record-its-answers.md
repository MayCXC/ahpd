---
title: A stop's interrupt waits for the CLI to record the stop's answers
status: done
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/turns.ts#L782-L823](../../../../packages/agent-claude/src/session/turns.ts#L782-L823) - `cancel`"
  - "[code://packages/agent-claude/src/session/query.ts#L742-L753](../../../../packages/agent-claude/src/session/query.ts#L742-L753) - the reader"
---

## Objective

`cancel` answers every call the session holds as it does now, and interrupts the CLI once the CLI has
reported a result for each of them; at once when it answered none, or when a call the CLI runs itself
is still open.

## Files

- `UPDATE: packages/agent-claude/src/session/turns.ts` - `cancel` reads the turn's open calls before
  answering any, keeps the ids it answers (the pending questions and the open calls a client owns), and
  either interrupts at once or leaves those ids in `stopAnswers`.
- `UPDATE: packages/agent-claude/src/session/query.ts` - the reader, while `stopAnswers` holds ids,
  crosses off each one a `user` frame reports a result for, and interrupts once none is left or once an
  `assistant` or `stream_event` frame shows the CLI has moved on; a `result` ends the wait with no
  interrupt.
- `UPDATE: packages/agent-claude/src/session/context.ts`, `packages/agent-claude/src/session.ts` -
  `stopAnswers`.
- `CREATE: packages/agent-claude/test/agent-claude-stopped-call.test.ts` - the SDK modelled as it
  orders the two writes: an answer heard when its promise settles, followed by the CLI's report of the
  call's result, and an interrupt heard when it is called.

## Steps

1. The cases, failing on `cancel` as built: the answer is heard after the interrupt.
2. `cancel` and the reader.
3. A stop with a call the CLI runs itself still interrupts at once.

## Validation

- `pnpm run typecheck` is clean.
- The two held cases fail before the change, the interrupt heard first, and pass after; the third
  passes both ways.
- The agent-claude and sdk suites pass.

## Resume

Done 2026-10-30.
