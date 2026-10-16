---
title: A bot chat is a session with no harness
domain: plugin
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugin/52-a-bot-manages-and-delegates/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L662](../../../../packages/sdk/src/types/plugin.ts#L662) - `registerAgent`, how the chat provider is added"
  - "[code://packages/sdk/src/types/agent.ts#L452-L466](../../../../packages/sdk/src/types/agent.ts#L452-L466) - an agent's `provider` id, unique on the host"
  - "[code://packages/sdk/src/host/routing.ts#L46](../../../../packages/sdk/src/host/routing.ts#L46) - the scheme of a session URI is its provider"
  - "[code://packages/sdk/src/host/history.ts#L275-L286](../../../../packages/sdk/src/host/history.ts#L275-L286) - `find`, how the host reads a session it does not hold"
  - "[code://packages/bot/src/record.ts#L80-L81](../../../../packages/bot/src/record.ts#L80-L81) - `BotRecord.session`, which goes"
  - "[code://packages/bot/src/provider.ts#L531-L542](../../../../packages/bot/src/provider.ts#L531-L542) - a new bot starts a harness session, which stops"
---

## Goal

The bot plugin registers a chat provider with its own id, such as `bot-chat`, that runs no model.
A direct chat is one session of it for one bot and one person.
The plugin keeps each chat's turns as a log, so a chat replays after a restart.
The plugin keeps an index of bot plus person to chat, so a person opens the same chat each time.
A chat and its session carry the bot's mark on `_meta`: slug, name, colour, labels, body and kind.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- No provider runs without a model.
- The record links one harness session, and the link breaks when that session goes.
- No grant lets a person open a direct chat with a bot.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One direct chat per bot and person | Softov, 2026-10-16, chose "One session per person" | - |
| The plugin's own index holds bot plus person to chat, and `BotRecord.session` goes | Softov, 2026-10-16, chose "Bot provider's own index" | - |
| A direct chat needs a grant of its own | Softov, 2026-10-16, chose "A grant of its own" | - |
| The provider id is not `bot` | Softov, 2026-10-16, chose "A new id, such as bot-chat" | - |
| No migration of old links | Softov, 2026-10-16, "ignore those. any migration process" | 03 |
| A read of `bot:/<slug>` answers `chat`, the reader's chat, and the first read starts it | Softov, 2026-10-16, chose "Read the bot answers it" | 02 |
| Every holder of `session:read` sees every chat until p4's members | Softov, 2026-10-16, chose "Wait for p4" | - |
| The grant is `bot:chat`, and the bot's owner chats without it | (defaulted: the proposal in this plan) | 02 |
| The provider id is `bot-chat` | (defaulted: the proposal in this plan) | 01 |
| The logs are in `<configDir>/bot-chats/`, not in the bot's folder, so a bot cannot rewrite a chat | (defaulted: the proposal in this plan) | 01 |
| A turn ends at once with no response until p3 | (defaulted: no wake exists before p3) | 01 |
| A person needs `session:create` as well, because `startSession` asks it | (defaulted: `startSession` asks the owner's grants) | 02 |
| The preamble goes, and p3 decides how the template reaches a wake | (defaulted: no session is a bot's session) | 03 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The bot-chat provider keeps a chat as a log](task-01-the-bot-chat-provider-keeps-a-chat-as-a-log.md) | todo | - |
| [02 - A read of a bot answers the reader's chat](task-02-a-read-of-a-bot-answers-the-readers-chat.md) | todo | 01 |
| [03 - A bot has no session link](task-03-a-bot-has-no-session-link.md) | todo | 02 |

## Resume state

- **Done so far:** planned 2026-10-16 with three tasks.
- **Next action:** build task 01.
- **Open questions:** none.
- **Watch out for:** a client opens a chat by its session URI. A chat is never addressed as `bot:/<slug>`.
