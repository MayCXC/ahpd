---
title: The error part says the words
status: done
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L803-L842](../../../../packages/agent-claude/src/session/query.ts#L803-L842) - the assistant frame and the result"
  - "[code://packages/agent-claude/test/agent-claude-failed-turn.test.ts](../../../../packages/agent-claude/test/agent-claude-failed-turn.test.ts) - the case"
---

## Objective

A failed result's words come from `result` for a `success` with `is_error`, and from `errors` otherwise.
A lead assistant frame with `error` adds no part.

## Files

- `UPDATE: packages/agent-claude/src/session/query.ts:803-842` - the frame skipped, and the words read.
- `CREATE: packages/agent-claude/test/agent-claude-failed-turn.test.ts` - the case.

## Steps

1. Add a case that feeds the two frames the CLI sent for a turn with no login.
2. Make the case expect the words in the error part, and in no markdown part.
3. Run the case, and see it fail.
4. Read the words from `result` or `errors`, by the subtype.
5. Skip a lead assistant frame with `error`.
6. Run the case again, and see it pass.

## Validation

- Run `agent-claude-failed-turn.test.ts` before steps 4 and 5, and see it fail.
- Run it after step 5, and see it pass.
- The type check passes.

## Resume

Done 2026-10-29.
Every step is built, and every check the Validation names was run.
