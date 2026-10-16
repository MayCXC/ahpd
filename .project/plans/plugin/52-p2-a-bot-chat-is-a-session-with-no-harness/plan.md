---
title: A bot chat is a session with no harness
domain: plugin
status: built
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
| A webhook reads `chat` off the bot as a person does, and every thread talks in that one chat | Softov, 2026-10-16, asked "How should the webhook reach a bot after p2?" and chose "Webhook uses its own chat" | 04 |
| A session owner may be `plugin:<name>`, so the webhook owns its chat | (defaulted: the builder, reviewed 2026-10-16) | 04 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The bot-chat provider keeps a chat as a log](task-01-the-bot-chat-provider-keeps-a-chat-as-a-log.md) | done | - |
| [02 - A read of a bot answers the reader's chat](task-02-a-read-of-a-bot-answers-the-readers-chat.md) | done | 01 |
| [03 - A bot has no session link](task-03-a-bot-has-no-session-link.md) | done | 02 |
| [04 - A webhook talks in its own chat](task-04-a-webhook-talks-in-its-own-chat.md) | done | 03 |

## Resume state

- **Done so far:** planned 2026-10-16 with three tasks. Task 01 implemented 2026-10-16: the `bot-chat` agent in `packages/bot/src/chat.ts`, registered in `apply`, keeping each turn as one JSON line under `<configDir>/bot-chats/` and answering `list`, `find` and `transcript` off those files. `packages/bot/test/bot-chat.test.ts` is the log, the restart and the unknown-slug refusal. The gates pass: 4196 tests over 212 files, the run needing `--maxWorkers=2 --testTimeout=10000` because `nested-start` and `nested-proxy` time out at five seconds on a loaded box. Task 02 implemented 2026-10-16: `read` answers the record with `chat`, the reader's own `bot-chat` session, held in the `bot-chats` records collection under a row id made safe the way a state volume name is, and started on the first read by a reader who holds `bot:chat` or owns the bot, one start per bot and person even when two reads arrive together. `FIELDS` takes `chat` and drops it. Four cases in `packages/bot/test/bot-provider.test.ts` are the chat, the two people, the reader who may not chat and the write that carries `chat` back; `bot-store.test.ts` and `bot-catalogue.test.ts` gained the new option and the new key. The gates pass, the full run's one failure being the known `nested-proxy` load flake, which passes alone. Task 03 implemented 2026-10-16: `session` is gone from `BotRecord`, `BotDraft`, `FIELDS` and `checkRecord`, `link` and `mayLink` go with it, a make starts no session and leaves only the folder behind, `preamble.ts` and `bot-preamble.test.ts` are deleted, and the store drops a `session` key an old file holds. Both docs say a read answers `chat` and what `bot:chat` is for. Build, typecheck, boundary, schema and `git diff --quiet tools/` pass; vitest is 4178 passed with 2 failures in `packages/server/test/webhook-bot.test.ts`, which is not in the task's files. Task 04 implemented 2026-10-16: the webhook's `session` seam is gone and `chat(bot)` reads the bot as a client does, answering the session and that session's own `defaultChat`; `botTarget` keeps one thread record per thread, every thread talking at the bot's one chat, and answers 409 with a problem line naming `bot:chat` and `session:create` when the read answers no `chat`. `packages/bot/src/start.ts` and its export are deleted, and WEBHOOKS.md says a bot endpoint talks in the plugin's own chat. One line beyond the task's files was needed, and it wants review: see the open questions. The gates pass: build, typecheck, boundary, schema and `git diff --quiet tools/`; vitest over sdk, server, bot and webhook is 4237 tests over 215 files, all passing.
- **Next action:** none. The plan is built. Reviewed and merged in `b4cf91dc`.
- **Open questions:** a refused `session:create` comes back out of `read` rather than answering the record without `chat`, and the catalogue holds a bot with no `chat`, because the chat is the reader's rather than the bot's. Both are what the task's steps say and neither is a hole in it. The task files never named `packages/sdk/src/validate.ts`, and its `OWNER` regex spelled four kinds and refused `plugin:`, so no step of task 04 could run until it took the fifth: a plugin reading a bot is a read that starts a session for `plugin:webhook`. `Owner` has spelled `plugin:<name>` since plugin/20 and the sessions store already reads that kind back, so the regex was the stale part, and its comment now says five. Softov has not reviewed that. The other reading - a plugin answered the chat of `root:<hostName>`, as a root connection and a host with no users directory are - would change `ownerOfPrincipal`'s use in `provider.ts` instead, and would make the plugin's chat the host's, shared with root and every other plugin. Something to weigh: widening it lets a plugin name any `plugin:<name>` as an owner, which is the looseness `user:` already has; the tighter rule is `plugin:<the plugin asking>`. And the plugin's own `session:create` is not asked anywhere on this road, because `beginPluginSession` asks that grant of a `user:` owner only - the e2e grants carry it because the task's step 6 names it, and the problem line names it beside `bot:chat`, which is the grant that does the work.
- **Watch out for:** a client opens a chat by its session URI. A chat is never addressed as `bot:/<slug>`.
