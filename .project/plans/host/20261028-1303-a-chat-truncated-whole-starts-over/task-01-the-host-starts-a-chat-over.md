---
title: The host starts a chat over
status: done
depends: []
layer: packages/sdk
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1484-L1567](../../../../packages/sdk/src/host/chatactions.ts#L1484-L1567) - `chat/truncated`, where the two refusals are"
  - "[code://packages/sdk/src/host/chatactions.ts#L895-L958](../../../../packages/sdk/src/host/chatactions.ts#L895-L958) - the restart held in `restarting`"
  - "[code://packages/sdk/test/host-chats.test.ts#L194-L210](../../../../packages/sdk/test/host-chats.test.ts#L194-L210) - the case that pins the refusal for the Claude backend"
  - "[code://packages/sdk/test/support/claude-sdk.ts#L168-L183](../../../../packages/sdk/test/support/claude-sdk.ts#L168-L183) - the fake SDK's store, which `deleteSession` joins"
---

## Objective

A truncation with no turn starts the chat over when its backend can delete.
So does a truncation at a local turn with no turn of the backend before it.
The host refuses a backend that cannot delete, as it does today.

## Files

- `UPDATE: packages/sdk/src/host/chatactions.ts:1484-1567` - the start-over, in place of the two refusals for a backend with `delete`.
- `UPDATE: packages/sdk/test/support/claude-sdk.ts:168-183` - `deleteSession`, which removes a conversation the fake holds and throws for one it does not.
- `UPDATE: packages/sdk/test/host-chats.test.ts:194-210` - the Claude backend starts over, under the chat's own name.
- `CREATE: packages/sdk/test/host-start-over.test.ts` - the order of the steps, a backend with no `delete`, a failed delete, and a local turn.
- `UPDATE: packages/sdk/test/ahp-test-cases.test.ts:263-520` - the three protocol cases out of both refusal lists, and the counts after them.

## Steps

1. Add `deleteSession` to the fake SDK, from the SDK's own description of it.
2. Write the new cases, and run them on the code before this task.
3. In `chat/truncated`, start the chat over where it refuses a cut before every turn the backend saw.
4. Refuse with today's words when the chat's backend has no `delete`.
5. Read the chat's backend id before anything closes.
6. Stop the chat's backend, and wait for it.
7. Delete the conversation through `ctx.deletedChat`.
8. After a failed delete, start the chat again resumed, and refuse the action with the reason.
9. After the delete, say the action, and forget the dropped turns' outputs and local turns.
10. Start the new backend with no resume, seeded with the kept turns.
11. Hold the work in `restarting` until `spawn` returns.
12. Move the three protocol cases out of both refusal lists, and correct the counts.

## Validation

- `packages/sdk/test/host-start-over.test.ts` holds these cases:
  - A backend with `delete` stops, then deletes the chat's conversation, then starts again with no resume.
  - The clients see `chat/truncated` before the new backend's snapshot, and the chat has no turns.
  - The host refuses a backend with no `delete`, and restarts nothing.
  - A failed delete refuses the action, and the chat comes back resumed with its turns.
  - A truncation at a local turn with no turn before it starts over and keeps the local turn.
  - An action sent during the start-over waits for the new backend.
- `packages/sdk/test/host-chats.test.ts`: the Claude backend deletes its conversation and starts a new CLI with no `resume`.
- Run the new cases on the code before this task, and expect them to fail.
- Run `pnpm vitest run packages/sdk --maxWorkers=1`, and expect it to pass.

## Resume

Done 2026-10-28.
A fifth case was added: the Claude CLI starts again under the same UUID once its transcript is gone.
The protocol cases 066 and 234 run and join `HOST_OWNS`: the host leaves `activeTurn` off where they write `null`.

