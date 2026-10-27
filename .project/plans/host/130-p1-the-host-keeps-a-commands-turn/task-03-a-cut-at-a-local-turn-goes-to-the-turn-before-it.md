---
title: A cut at a local turn goes to the turn before it
status: todo
depends: [task-01-a-commands-turn-is-kept-when-it-ends.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1484-L1548](../../../../packages/sdk/src/host/chatactions.ts#L1484-L1548) - `chat/truncated`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1146-L1156](../../../../packages/sdk/src/host/sessionmethods.ts#L1146-L1156) - a fork in `createChat`"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentSideEffects.ts#L1954-L1982 - the reference's truncation
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentService.ts#L7166-L7195 - the reference's fork
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentService.ts#L9828-L9838 - `_persistForkedLocalTurns`
---

## Objective

A truncation or a fork at a local turn asks the backend for the point of the nearest earlier turn that is not local.
A truncation forgets the local turns that it drops, and a fork keeps the forked local turns for the new chat.

## Files

- `UPDATE: packages/sdk/src/host/localturns.ts` - `concreteTurnOf`, `forgetLocalTurns` and `copyLocalTurns`.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1505-1530` - the truncation asks for the end point of the concrete turn, and forgets the local turns that it drops.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1146-1156` - the fork asks for the fork point of the concrete turn, and copies the local turns to the new chat.
- `UPDATE: packages/sdk/test/host-local-turns.test.ts` - the cases below.

## Steps

1. Write `concreteTurnOf`, which answers the nearest turn at or before `at` that is not a local turn.
2. Answer nothing when every turn up to `at` is a local turn.
3. In the truncation, refuse with the words for a whole-conversation clear when there is no concrete turn.
4. In the truncation, ask `endPoint` for the concrete turn's id.
5. After the truncation goes out, forget the local turns among the turns that it drops.
6. Write `forgetLocalTurns(session, chat, turns)`, which removes the file of each turn that has one.
7. In the fork, refuse as for an unknown fork point when there is no concrete turn.
8. In the fork, ask `forkPoint` for the concrete turn's id.
9. Write `copyLocalTurns`, which copies the files of the local turns in `turns` to the new chat.
10. Copy the transcript ids of every turn in `turns` to the new chat as well.
11. Copy before the new chat starts, as the reference records before it creates the chat.

## Validation

- `packages/sdk/test/host-local-turns.test.ts`: a truncation at a `!` turn rewinds the backend at the turn before it, and keeps the `!` turn.
- A truncation at the turn before a `!` turn drops the `!` turn and its file.
- The host refuses a truncation at a `!` turn with no turn before it.
- A fork at a `!` turn forks the backend at the turn before it.
- After a restart, the forked chat holds the `!` turn.
- `pnpm vitest run packages/sdk/test/host-local-turns.test.ts` passes.

## Resume

