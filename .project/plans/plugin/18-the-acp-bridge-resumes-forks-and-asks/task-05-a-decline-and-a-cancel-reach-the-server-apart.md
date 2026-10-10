---
title: A decline and a cancel reach the server apart
status: done
depends: [task-03-a-servers-question-is-asked-in-the-chat.md]
layer: "sdk, agent-acp"
refs:
  - "[code://packages/sdk/src/types/session.ts#L553](../../../../packages/sdk/src/types/session.ts#L553) - `Session.answer`, which carries only `accepted`"
  - "[code://packages/sdk/src/host/chatactions.ts#L1268-L1273](../../../../packages/sdk/src/host/chatactions.ts#L1268-L1273) - the host reads `response` and reduces it to `accepted`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L479-L487](../../../../packages/agent-acp/src/session/handlers.ts#L479-L487) - `answerElicitation` sends `decline` for every answer that is not an accept"
  - "[code://packages/agent-acp/test/agent-acp-ports.test.ts](../../../../packages/agent-acp/test/agent-acp-ports.test.ts) - a real host carries a client's answer to the backend"
---

## Objective

A person's `decline` reaches an ACP server as `decline`, and their `cancel` reaches it as `cancel`.
Other backends see no change.

## Files

- `UPDATE: packages/sdk/src/types/session.ts:553` - `answer` takes an optional fourth parameter, the response kind.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1268-1273` - pass the action's `response` to `session.answer`.
- `UPDATE: packages/agent-acp/src/session/handlers.ts:479-487` - `answerElicitation` answers `cancel` when the response is `cancel`.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - a client's decline and a client's cancel, each read from the server's log.
- `UPDATE: packages/agent-acp/README.md` - what a decline and a cancel answer.
- `UPDATE: docs/PLUGINS.md` - the same, where the question paragraph is.

## Steps

1. Add `response?: 'accept' | 'decline' | 'cancel'` as the fourth parameter of `Session.answer`.
2. In `chatactions.ts`, pass `response` to `session.answer` when the action carries one.
3. In `answerElicitation`, settle `{ action: 'cancel' }` when the response is `cancel`, and `{ action: 'decline' }` for any other refusal.
4. Leave the other backends as they are, because the parameter is optional.
5. Add one test for a client's decline and one for a client's cancel.
6. Change the README and `docs/PLUGINS.md` sentences that say the two are the same.

## Validation

- `packages/agent-acp/test/agent-acp-ports.test.ts`: the server logs `decline` for a client's decline and `cancel` for a client's cancel.
- `pnpm typecheck` and `pnpm boundary` green; `pnpm exec vitest run packages/agent-acp packages/sdk` green.

## Resume

- Built 2026-10-10 by dsh; the turn stopped on a provider error after this task, and the rest was finished in the same worktree.
- The host passes `response` only when it is `accept`, `decline` or `cancel`; any other value is left out, and the backend reads `accepted` alone.
- The decline case was already in `packages/agent-acp/test/agent-acp-ports.test.ts` from task 03; this task added the cancel case beside it.
- No other backend changed, because the parameter is optional.
