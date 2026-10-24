---
title: Every start uses the chat's own backend
status: done
depends:
  - task-01-a-chat-keeps-the-backend-that-serves-it.md
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L618](../../../../packages/sdk/src/host/lifecycle.ts#L618) - `deletedChat`, called with the session's agent"
  - "[code://packages/sdk/src/host/lifecycle.ts#L752-L781](../../../../packages/sdk/src/host/lifecycle.ts#L752-L781) - a session restart spawns its chats"
  - "[code://packages/sdk/src/host/lifecycle.ts#L919-L950](../../../../packages/sdk/src/host/lifecycle.ts#L919-L950) - `restartChat`"
  - "[code://packages/sdk/src/host/sleep.ts#L245-L336](../../../../packages/sdk/src/host/sleep.ts#L245-L336) - the daemon restore"
  - "[code://packages/sdk/src/host/chatactions.ts#L538](../../../../packages/sdk/src/host/chatactions.ts#L538) - credentials by the session's provider"
  - "[code://packages/sdk/src/host/chatactions.ts#L756](../../../../packages/sdk/src/host/chatactions.ts#L756) - the config schema read from the session's agent"
  - "[code://packages/sdk/src/host/chatactions.ts#L1004-L1007](../../../../packages/sdk/src/host/chatactions.ts#L1004-L1007) - the session-key fan-out"
  - "[code://packages/sdk/src/host/chatactions.ts#L1076](../../../../packages/sdk/src/host/chatactions.ts#L1076) - credentials by the session's provider"
  - "[code://packages/sdk/src/host/chatactions.ts#L1513](../../../../packages/sdk/src/host/chatactions.ts#L1513) - a rewind spawns with the owner's agent"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1106-L1117](../../../../packages/sdk/src/host/sessionmethods.ts#L1106-L1117) - fork and side chat checks on `held.agent`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1312](../../../../packages/sdk/src/host/sessionmethods.ts#L1312) - the move's provider check"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1365](../../../../packages/sdk/src/host/sessionmethods.ts#L1365) - `deletedChat` on a chat delete"
  - "[code://packages/sdk/src/host/catalogue.ts#L158](../../../../packages/sdk/src/host/catalogue.ts#L158) - `movable`"
---

## Objective

Each path that starts a chat again uses the chat's own backend and config.
The session's keys of its own backend do not reach a foreign chat.

## Files

- `UPDATE: packages/sdk/src/host/lifecycle.ts:752-781` - a session restart spawns each chat with `chatAgent` and `chatConfig`.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:919-950` - `restartChat` uses the chat's own agent.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:618` - `deletedChat` gets the chat's own agent.
- `UPDATE: packages/sdk/src/host/sleep.ts:245-336` - the restore starts a chat on its stored provider, with that agent's transcript and the chat's config.
- `UPDATE: packages/sdk/src/host/chatactions.ts:538` - credentials by the chat's provider.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1076` - credentials by the chat's provider.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1513` - a rewind spawns the chat's own agent.
- `UPDATE: packages/sdk/src/host/chatactions.ts:756` - refuse `session/configChanged` on a foreign chat.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1004-1007` - the fan-out skips a foreign chat.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1106-1117` - fork and side chat read the source chat's agent.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1312` - refuse a move of a foreign chat.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1365` - `deletedChat` gets the chat's own agent.
- `UPDATE: packages/sdk/src/host/catalogue.ts:158` - `movable` is false for a foreign chat.
- `UPDATE: packages/sdk/test/host-chats.test.ts` - two-agent cases for each start path.

## Steps

1. Use `chatAgent` and `chatConfig` at each spawn in a session restart.
2. Use them in `restartChat` and in the rewind.
3. Pass the chat's agent to `deletedChat` on a close and on a delete.
4. Ask `tokensFor` with the chat's provider.
5. In the restore, read each chat's stored provider and get that agent from `ctx.agents`.
6. Read the transcript from that agent, and pass the chat's stored config.
7. Log and skip a chat whose agent is not loaded, and start the other chats.
8. Make the restore wait for each chat's provider, not only the session's.
9. Skip a foreign chat in the session-key fan-out.
10. Refuse `session/configChanged` on a foreign chat with a clear message.
11. Read the source chat's agent for a fork and a side chat.
12. Refuse a move of a foreign chat, and answer `movable` false for it.
13. Add the tests, and run the sdk tests.
14. Set this task and its plan row to `implemented`.

## Validation

- `host-chats.test.ts`: a chat of agent B in a session of agent A starts on B after a session restart.
- `host-chats.test.ts`: the same after `restartChat`, a rewind and a daemon restart.
- `host-chats.test.ts`: a restore with B not loaded starts the session's other chats and logs one line.
- `host-chats.test.ts`: a `scope: 'session'` key of A is not pushed to the chat of B.
- `host-chats.test.ts`: the host refuses a move of the chat of B, and its row is not `movable`.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm test` pass.
