---
title: The bot-chat provider keeps a chat as a log
status: done
depends: []
layer: packages/bot
refs:
  - "[code://packages/sdk/src/types/agent.ts#L452-L719](../../../../packages/sdk/src/types/agent.ts#L452-L719) - `Agent`, which the chat provider implements"
  - "[code://packages/sdk/src/types/session.ts#L289](../../../../packages/sdk/src/types/session.ts#L289) - `Session`, which a chat implements"
  - "[code://packages/agent-cofold/src/session.ts](../../../../packages/agent-cofold/src/session.ts) - a small session to copy the shape from"
  - "[code://packages/agent-cofold/src/agent.ts#L827](../../../../packages/agent-cofold/src/agent.ts#L827) - `create`, and the `list`, `find` and `transcript` around it"
  - "[code://packages/sdk/src/types/plugin.ts#L451](../../../../packages/sdk/src/types/plugin.ts#L451) - `configDir`, where the logs are kept"
  - "[code://packages/sdk/src/types/plugin.ts#L662](../../../../packages/sdk/src/types/plugin.ts#L662) - `registerAgent`"
  - "[code://packages/bot/src/plugin.ts#L49-L82](../../../../packages/bot/src/plugin.ts#L49-L82) - `apply`, where the agent is registered"
---

## Objective

The bot plugin registers an agent with the provider id `bot-chat` and the display name "Bot chat".
A session of it runs no model.
Each message a person sends is a turn, and the turn ends at once with no response.
The session keeps each turn as one JSON line in `<configDir>/bot-chats/<session id>.jsonl`.
After a restart, `list`, `find` and `transcript` read the logs, so a client opens a chat and sees every turn.
The schema has one key, `bot`, the slug, with `sessionMutable: false`.
The session's `_meta` carries the bot's mark: `bot`, `name`, `color`, `labels`, `body` and `kind: "direct"`.

## Files

- `CREATE: packages/bot/src/chat.ts` - the `bot-chat` agent, its session and the log.
- `UPDATE: packages/bot/src/plugin.ts` - register the agent.
- `CREATE: packages/bot/test/bot-chat.test.ts` - tests of the log, the turn and the restart.

## Steps

1. Read `packages/agent-cofold/src/session.ts` and copy its shape for the chat session.
2. Make `botChatAgent(configDir, store)` answer an `Agent` with provider `bot-chat`.
3. Give the schema one key, `bot`, a string with `sessionMutable: false`.
4. Refuse `create` when `bot` names no bot in the store, with "There is no bot <slug>."
5. Append each turn as one JSON line to `<configDir>/bot-chats/<id>.jsonl`.
6. End each turn at once, with no response part.
7. Answer `list`, `find` and `transcript` from the log files.
8. Put the bot's mark on the session's `_meta`, from the record at `create`.
9. Register the agent in `apply`.
10. Write a test: two turns are two lines, and `transcript` answers both after a new agent reads the folder.
11. Write a test: the host refuses `create` with an unknown slug, with its sentence.

## Validation

- `pnpm -s exec vitest run packages/bot` passes.
- The gates pass: build, typecheck, boundary, schema and vitest.
