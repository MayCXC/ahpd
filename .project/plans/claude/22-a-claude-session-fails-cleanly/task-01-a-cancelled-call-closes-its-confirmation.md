---
title: A cancelled call closes its confirmation
status: todo
depends: []
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/asking.ts#L169-L360](../../../../packages/agent-claude/src/session/asking.ts#L169-L360) - `canUseTool`, which puts a confirmation or a question in `pending`"
  - "[code://packages/agent-claude/src/session/asking.ts#L480-L490](../../../../packages/agent-claude/src/session/asking.ts#L480-L490) - an answer, which deletes the entry and removes it"
  - "[code://packages/agent-claude/src/session/turns.ts#L599-L601](../../../../packages/agent-claude/src/session/turns.ts#L599-L601) - a stop, which settles every pending input"
  - "[code://packages/agent-claude/test/agent-claude-tool-input.test.ts](../../../../packages/agent-claude/test/agent-claude-tool-input.test.ts) - the confirmation tests"
---

## Objective

When the SDK aborts a `canUseTool` call, its confirmation or question is settled and its input-needed entry is removed.
An entry is settled once, whether the abort, an answer, a stop, a subagent end or a close comes first.

## Files

- `UPDATE: packages/agent-claude/src/session/asking.ts:169-360` - read `signal` from the SDK's options, and settle the entry on abort.
- `UPDATE: packages/agent-claude/test/agent-claude-tool-input.test.ts` - the cases below.

## Steps

1. Read `signal` from the third argument of `canUseTool`.
2. Return a deny at once when the signal is already aborted, and put nothing in `pending`.
3. Listen for `abort` on the signal after the entry goes into `pending`.
4. On abort, delete the entry from `pending` and call `ctx.inputNeededRemoved` with its id.
5. Settle the entry with a deny that says "Cancelled".
6. Do nothing on abort when the entry is no longer in `pending`.
7. Remove the listener when an answer, a stop, a subagent end or a close settles the entry.

## Validation

- An abort while a confirmation waits removes the entry, and the SDK gets a deny.
- An abort while a question waits removes the entry.
- An answer, then an abort, removes the entry once.
- A signal that aborts before the call puts no entry.
- `pnpm exec vitest run packages/agent-claude` passes.

## Resume
