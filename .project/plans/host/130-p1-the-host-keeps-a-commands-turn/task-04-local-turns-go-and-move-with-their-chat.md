---
title: Local turns go and move with their chat
status: done
depends: [task-01-a-commands-turn-is-kept-when-it-ends.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L185-L188](../../../../packages/sdk/src/host/sessionmethods.ts#L185-L188) - a chat's move"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L218-L219](../../../../packages/sdk/src/host/sessionmethods.ts#L218-L219) - a move taken back"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1411-L1414](../../../../packages/sdk/src/host/sessionmethods.ts#L1411-L1414) - `disposeChat`"
  - "[code://packages/sdk/src/host/outputs.ts#L285-L307](../../../../packages/sdk/src/host/outputs.ts#L285-L307) - `forgetChatOutputs` and `moveChatOutputs`"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L138-L142 - `forgetChat`
---

## Objective

A chat that goes takes its local turns and its transcript ids with it.
A chat that moves to another session takes its local turns to that session's folder, and a move that is refused takes them back.

## Files

- `UPDATE: packages/sdk/src/host/localturns.ts` - `forgetChatLocalTurns` and `moveChatLocalTurns`.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:188` - a move takes the chat's local turns.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:219` - a refused move takes them back.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1414` - `disposeChat` forgets the chat's local turns.
- `UPDATE: packages/sdk/test/host-local-turns.test.ts` - the cases below.

## Steps

1. Write `forgetChatLocalTurns(session, chat)`, which removes the chat's folder and its transcript ids.
2. Write `moveChatLocalTurns(from, to, chat)`, which moves each file to the other session's folder, as `moveChatOutputs` does.
3. Call each one beside the call to its outputs counterpart.

## Validation

- `packages/sdk/test/host-local-turns.test.ts`: a disposed chat's folder is gone.
- A chat moved to another session holds its `!` turn there after a restart.
- `pnpm vitest run packages/sdk/test/host-local-turns.test.ts` passes.

## Resume

- **Done:** 2026-10-27.

