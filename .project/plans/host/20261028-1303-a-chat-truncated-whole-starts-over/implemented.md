---
title: A chat truncated whole starts over - implemented
date: 2026-10-28
refs:
  - "[code://packages/sdk/src/host/chatactions.ts](../../../../packages/sdk/src/host/chatactions.ts)"
  - "[code://packages/sdk/test/host-start-over.test.ts](../../../../packages/sdk/test/host-start-over.test.ts)"
  - "[code://packages/sdk/test/support/claude-sdk.ts](../../../../packages/sdk/test/support/claude-sdk.ts)"
---

A `chat/truncated` with no `turnId` starts the chat over when its backend can delete its conversation.
The backend stops, its conversation is deleted, and a new one starts for the same chat with nothing to resume.
A truncation at a `!` command's turn with no turn of the backend before it starts over the same way.
That chat keeps the command turns up to the one named.
A backend with no `delete` is refused as before.

## What was built

- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - `startOver` in `chat/truncated`.
  It reads the chat's backend id, stops the backend and waits, and deletes through `ctx.deletedChat`.
  Then it says the action, forgets the dropped turns' outputs and local turns, and spawns with no resume.
  A failed delete spawns the chat resumed with all its turns, and refuses the action with the reason.
  The work is held in `restarting`, so an action behind it waits.
- [`code://packages/sdk/test/support/claude-sdk.ts`](../../../../packages/sdk/test/support/claude-sdk.ts) - `deleteSession`, which removes a conversation the fake holds and throws for one it does not.

## Verified

- `packages/sdk/test/host-start-over.test.ts`: five cases, and four of them fail on the code before the change:
  - the order of stop, delete and start;
  - a turn sent during the start-over;
  - the Claude CLI started again under the same UUID with no `resume`;
  - a failed delete.
- The fifth case, a backend with no `delete`, passes on both.
- `packages/sdk/test/host-chats.test.ts`: the Claude backend deletes its conversation and starts a new CLI; it fails before the change.
- `packages/sdk/test/host-local-turns.test.ts`: a cut at a command's turn with no turn before it starts over and keeps the command's turn; it fails before the change.
- `packages/sdk/test/ahp-test-cases.test.ts`: the protocol cases 066, 068 and 234 run through the host and leave the refusal lists.
  066 and 234 join `HOST_OWNS`, because the host leaves `activeTurn` off where the cases write `null`.
- The sdk suite passes at one worker, 3677 cases with 2 skipped, and the agent-claude suite passes, 400 cases.
  Boundary, typecheck, build and schema pass.

## Departures from the plan

- None.

## Left for later

- None.
