---
title: A cofold prompt is stored under its turn's id
status: todo
depends: []
layer: "agent-cofold"
refs:
  - "[code://packages/agent-cofold/src/turns.ts#L219-L235](../../../../packages/agent-cofold/src/turns.ts#L219-L235) - `launch`"
  - "[code://packages/agent-cofold/src/transcript.ts#L317-L326](../../../../packages/agent-cofold/src/transcript.ts#L317-L326) - the id of a turn read back"
---

## Objective

A cofold turn's prompt is stored under the turn's id, and the turn is read back under that id.

## Files

- `UPDATE: packages/agent-cofold/src/turns.ts:222-228` - `run` takes `messageId: turnId`.
- `UPDATE: packages/agent-cofold/test/agent-cofold-store.test.ts` - the case below.

## Steps

1. Pass `messageId: turnId` to `run` in `launch`.
2. Cite `RunArgs.messageId` beside it.

## Validation

- `packages/agent-cofold/test/agent-cofold-store.test.ts`: `transcript` reads a completed turn back under the id that the client gave it.
- `pnpm vitest run packages/agent-cofold` passes.

## Resume

