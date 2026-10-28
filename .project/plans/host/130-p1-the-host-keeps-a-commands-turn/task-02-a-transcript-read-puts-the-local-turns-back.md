---
title: A transcript read puts the local turns back
status: done
depends: [task-01-a-commands-turn-is-kept-when-it-ends.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/history.ts#L374-L392](../../../../packages/sdk/src/host/history.ts#L374-L392) - `past`"
  - "[code://packages/sdk/src/host/sleep.ts#L315-L318](../../../../packages/sdk/src/host/sleep.ts#L315-L318) - a wake's lead chat"
  - "[code://packages/sdk/src/host/sleep.ts#L355-L358](../../../../packages/sdk/src/host/sleep.ts#L355-L358) - a wake's other chats"
  - "[code://packages/sdk/src/host/snapshots.ts#L432-L436](../../../../packages/sdk/src/host/snapshots.ts#L432-L436) - a chat's snapshot"
  - "[code://packages/sdk/src/host/outputs.ts#L199-L219](../../../../packages/sdk/src/host/outputs.ts#L199-L219) - `turnsOf`, for a retained terminal's rebuild"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L171-L234 - the check and the interleave
---

## Objective

Every read of a backend's transcript goes through one host read.
That read hands the backend the chat's outputs, and puts the chat's local turns back into the turns that the backend answers with.

## Files

- `UPDATE: packages/sdk/src/host/localturns.ts` - `transcriptOf`, the one read, and `withLocalTurns`, the interleave.
- `UPDATE: packages/sdk/src/host/history.ts:379` - `past` reads through `transcriptOf`.
- `UPDATE: packages/sdk/src/host/sleep.ts:318` - the lead chat of a wake reads through `transcriptOf`.
- `UPDATE: packages/sdk/src/host/sleep.ts:358` - each other chat of a wake reads through `transcriptOf`.
- `UPDATE: packages/sdk/src/host/snapshots.ts:436` - a chat's snapshot reads through `transcriptOf`.
- `UPDATE: packages/sdk/src/host/outputs.ts:217` - `turnsOf` reads through `transcriptOf`.
- `UPDATE: packages/sdk/test/host-local-turns.test.ts` - the cases below.

## Steps

1. Read the chat's files, and skip one that is not version 1 or that fails the reference's check.
2. Leave a local turn that the transcript holds already where the transcript has it.
3. Put the local turns with no anchor first, in `seq` order.
4. Put each other local turn after the turn its anchor names, in `seq` order.
5. Put a local turn before a held local turn of the same anchor when its `seq` is lower.
6. Drop a local turn whose anchor no turn of the transcript has.
7. Answer a copy of the transcript's turns when the chat has no local turns.
8. Write `transcriptOf(agent, id, at, session, chat)`, which reads `agent.transcript` with `outputsFor` and answers `withLocalTurns`.
9. Read through `transcriptOf` at the five places, with the session and chat each passes to `outputsFor`.

## Validation

- `packages/sdk/test/host-local-turns.test.ts`: after a restart, a session's first chat holds its `!` turn after the turn it followed.
- A chat that is not the first, woken from its own transcript, holds its `!` turn too.
- A `!` turn with no anchor comes first, and two `!` turns after one turn keep their order.
- A `!` turn whose anchor the transcript no longer holds is not there.
- A transcript that holds a local turn already shows it once, and the next local turn after it.
- After a restart, a subscribe to the `!` call's terminal answers the exited terminal with its output.
- `pnpm vitest run packages/sdk/test/host-local-turns.test.ts packages/sdk/test/host-retained-terminals.test.ts` passes.

## Resume

- **Done:** 2026-10-27.
  A held local turn stays in place, and the others of its anchor go in around it by `seq`.
  The plan's first answer put a later one before it.

