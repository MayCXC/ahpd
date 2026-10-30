---
title: A stopped turn tells Claude it was stopped - implemented
date: 2026-10-30
refs:
  - git://3d9a9f3f - the change
  - "[code://packages/agent-claude/src/session/turns.ts#L782-L823](../../../../packages/agent-claude/src/session/turns.ts#L782-L823) - `cancel` answers the calls it holds and interrupts at once or leaves the interrupt to the reader"
  - "[code://packages/agent-claude/src/session/query.ts#L742-L753](../../../../packages/agent-claude/src/session/query.ts#L742-L753) - the reader sends a stop's interrupt once the CLI has reported the stop's answers"
---

A turn stopped while a call waits on a person, or while a client runs a call for it, tells Claude
"The turn was stopped" for that call.

## What was built

- [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts) - `cancel` reads the turn's open calls before it answers any, keeps the ids it answers (the pending questions and the open calls a client owns), and interrupts at once when it answered none or when another call is still open; otherwise it leaves the ids in `stopAnswers`.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - while `stopAnswers` holds ids, each result a `user` frame reports crosses one off, and the interrupt goes out once none is left or an `assistant` or `stream_event` frame arrives; a `result` ends the wait with no interrupt.
- [`code://packages/agent-claude/src/session/context.ts`](../../../../packages/agent-claude/src/session/context.ts) - `stopAnswers`.
- [`code://packages/agent-claude/test/agent-claude-stopped-call.test.ts`](../../../../packages/agent-claude/test/agent-claude-stopped-call.test.ts) - a stop with a question waiting, with a client's call running, and with a call the CLI runs itself.
- [`code://packages/sdk/test/host-input.test.ts`](../../../../packages/sdk/test/host-input.test.ts) - "settles the blocked promise when the turn is cancelled" asks with the call's id, as the SDK does, and has the CLI report the call's result before it counts the interrupt.

## Verified

- The two held cases fail against `cancel` before the change, with the interrupt heard before the answer, and pass with it; the third passes both ways.
- The type check passes. The agent-claude suite passes (51 files, 471 tests). The sdk suite's failures here are the same with upstream's backend: `container-relay`, `nested-start`, and `wire.test.ts` under load, which passes alone.
- On the CLI the SDK 0.3.301 runs, through a stand-in for the Messages API: an answer followed by an interrupt once the CLI reports the call's result reaches the model as "The turn was stopped" and "[Request interrupted by user]", for a question and for a client's call, twice each.

## Departures from the plan

- `host-input.test.ts` changed with the behavior: it counted the interrupt before any result was reported.

## Left for later

- none. A call the CLI runs itself keeps the CLI's own text after a stop, as the plan's risks say.
