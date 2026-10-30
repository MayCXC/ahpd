---
title: The host refuses a confirmation or an answer nothing waits on
status: pending
depends: []
layer: host
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1423-L1470](../../../../packages/sdk/src/host/chatactions.ts#L1423-L1470) - the two actions"
  - "[code://packages/sdk/src/types/session.ts#L638-L649](../../../../packages/sdk/src/types/session.ts#L638-L649) - `confirm`"
---

## Objective

`confirm` answers whether a call was waiting on a confirmation, and the host refuses a
`chat/toolCallConfirmed` it was not, and a `chat/inputCompleted` that `answer` did not take.

## Files

- `UPDATE: packages/sdk/src/types/session.ts` - `confirm` answers a boolean, false when no call by
  that id waits on a confirmation.
- `UPDATE: packages/sdk/src/host/chatactions.ts` - both actions refused through `no` when not taken.
- `UPDATE: packages/agent-claude/src/session/asking.ts`, `packages/agent-cofold/src/pauses.ts`,
  `packages/agent-pi/src/session.ts`, `packages/agent-acp/src/session/handlers.ts`,
  `packages/bot/src/chat.ts`, `packages/sdk/src/sessions/nested.ts`, `examples/echo/agent.ts`,
  `examples/notes/agent.ts` - each `confirm` answers false where it returned without acting, true
  where it took the confirmation; the nested session takes one for a call of its running turn in
  `pending-confirmation`, and the bot one for a call it asked about that still waits.
- `UPDATE: packages/sdk/test/host-input.test.ts` - the answer nothing waits on is refused, and a
  confirmation of a call that waits on none is.
- `UPDATE: packages/sdk/test/subagent-chat.test.ts`, `packages/sdk/test/subagent-link.test.ts` - the
  test sessions' `confirm` answer.

## Steps

1. `confirm`'s signature and documentation, then each implementation.
2. The two cases of the host's switch.
3. The tests.

## Validation

- `pnpm run typecheck` is clean.
- `packages/sdk/test/host-input.test.ts`: the two refusals fail on the host before this and pass
  after.
- The sdk suite and each changed backend's suite pass.

## Resume

Not started.
