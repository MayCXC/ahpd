---
title: Claude's chat state holds every turn
status: todo
depends:
  - task-02-a-snapshot-follows-the-subscribes-view.md
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session.ts#L242-L262](../../../../packages/agent-claude/src/session.ts#L242-L262) - `chatState()`, which cuts with `...tail(ctx.turns)`"
  - "[code://packages/agent-acp/src/session.ts#L251](../../../../packages/agent-acp/src/session.ts#L251) - the sibling that gives every turn"
  - "[code://packages/sdk/src/host/tooling.ts#L1427-L1437](../../../../packages/sdk/src/host/tooling.ts#L1427-L1437) - `get_session_context`, which reads `chatState()`"
  - "[code://packages/sdk/src/tools/session.ts#L630](../../../../packages/sdk/src/tools/session.ts#L630) - `transcriptLimit`, the cut that tool keeps"
  - "[code://packages/sdk/test/host-catalogue.test.ts#L276-L379](../../../../packages/sdk/test/host-catalogue.test.ts#L276-L379) - the live case from task 01"
---

## Objective

Claude's `chatState()` gives every turn it holds, as the ACP, pi, cofold and bot backends do.
A subscribe with no view to a live Claude chat then gets every turn, and the host applies a view from task 02.

## Files

- `UPDATE: packages/agent-claude/src/session.ts:242-262` - `chatState()` gives `turns: ctx.turns`, and the comment above it says the host cuts for a view.
- `UPDATE: packages/sdk/test/host-catalogue.test.ts:276-379` - the live case from task 01 becomes `it`, and one case subscribes to a live chat with a view.

## Steps

1. Replace `...tail(ctx.turns)` in `chatState()` with `turns: ctx.turns`.
2. Remove the `tail` import from `session.ts` if nothing else in the file uses it.
3. Change the live case from task 01 from `it.fails` to `it`.
4. Add a case that subscribes to the live chat with a view, and expects a window and a cursor.
5. Run the `get_session_context` tests, and check that `transcriptLimit` still cuts the transcript.
6. Run the agent-claude and sdk tests, and set this task and its plan row to `implemented`.

## Validation

- `pnpm vitest run packages/sdk/test/host-catalogue.test.ts packages/sdk/test/sessiontools.test.ts` passes.
- `pnpm vitest run packages/agent-claude/test` passes.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

