---
title: A person talks with a bot in a chat of their own
domain: plugin
status: draft
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugin/49-a-bots-first-turn-is-a-template/plan.md
  - plans/host/71-an-automation-wakes-on-what-a-session-does/plan.md
changes: []
creates: []
refs:
  - "[code://packages/bot/src/record.ts#L53-L86](../../../../packages/bot/src/record.ts#L53-L86) - `BotRecord`, whose `session` field goes"
  - "[code://packages/bot/src/wake.ts#L221-L234](../../../../packages/bot/src/wake.ts#L221-L234) - `sessionFor`, the request a wake session is made from"
  - "[code://packages/bot/src/provider.ts#L531-L542](../../../../packages/bot/src/provider.ts#L531-L542) - a new bot starts a harness session today"
  - "[code://packages/sdk/src/host/routing.ts#L46](../../../../packages/sdk/src/host/routing.ts#L46) - a URI whose scheme is an agent's id is a session"
  - "[code://packages/sdk/src/types/plugin.ts#L662](../../../../packages/sdk/src/types/plugin.ts#L662) - `registerAgent`, how the chat provider is added"
  - "[code://packages/sdk/src/types/plugin.ts#L824](../../../../packages/sdk/src/types/plugin.ts#L824) - `registerTriggerType`, how a chat message wakes an automation"
  - "[code://packages/sdk/src/types/triggers.ts#L24](../../../../packages/sdk/src/types/triggers.ts#L24) - the `childFinished` event kind"
  - "[code://docs/sdk/SESSIONS.md](../../../../docs/sdk/SESSIONS.md) - session grants are by role, not per session"
  - "[code://docs/plugins/BOTS.md](../../../../docs/plugins/BOTS.md) - the bot doc"
---

## Goal

A person talks with a bot in a direct chat of their own.
Luiz and Maria each have one chat with Backer, and neither sees the other's.
A group chat has members, and `@backer` in it wakes Backer.
A message wakes a session that works in the bot's folder, and the bot answers only with `post_message`.
A chat keeps its own history, so it outlives a daemon restart and a change of the bot's harness.
A bot made from the manager template organizes work in a host task list and delegates it to sessions in the project.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "session" packages/bot/src` - the record links one harness session, made with the bot.
- `rg -n "sender" packages/sdk/src/types/agent.ts` - a backend does not get the sender of a turn.
- `rg -n "registerTriggerType|childFinished" packages/sdk/src` - a plugin trigger type and the `childFinished` event exist.

### Runtime path

```
person -> bot-chat session (no model) -> fire bot message -> automation -> wake session in <root>/<slug> -> post_message -> the open turn's response -> person
```

### Gaps

- A chat with a bot is a harness session, and its link on the record goes stale. Softov's chat with Boozi in ahpw failed with "the session does not exist" on 2026-10-16.
- No session provider runs without a model.
- A backend does not get the sender of a turn.
- No `post_message` tool and no `bot` trigger type.
- A session has no member list.
- No task list on the host.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Each person has their own direct chat with a bot, and their own bot session behind it | Softov, 2026-10-16, chose "One session per person" | p2, p3 |
| A direct chat needs a grant of its own, not only `bot:read` | Softov, 2026-10-16, chose "A grant of its own" for "Who may open a direct chat with Backer?" | p2 |
| A person's turn stays open until the bot calls `post_message` | Softov, 2026-10-16, chose "Turn stays open" | p3 |
| The bot plugin keeps its own index of bot plus person to chat, and the record holds no session | Softov, 2026-10-16, chose "Bot provider's own index" | p2 |
| A bot has one private session, and a wake with no person behind it goes there | Softov, 2026-10-18, "each bot will have its own private session.. no one can chat on it.. only system instructions or wake automations." | p14 |
| Only `@<slug>` wakes a bot in a group chat | Softov, 2026-10-16, chose "Only @backer" | p14 |
| The host's bot rules go in as a system prompt where the harness takes one | Softov, 2026-10-16, chose "System prompt where possible" | p3 |
| A group chat is a session for now, with members on it, and VS Code can chat in it | Softov, 2026-10-16, "can be a session for now, but we can control who access? so vs code could chat on it?", then chose "Members on the chat session" | p14 |
| The chat provider has an id of its own, such as `bot-chat`, and `bot:/<slug>` stays the record | Softov, 2026-10-16, chose "A new id, such as bot-chat" | p2 |
| The persona is `AGENTS.md` in the bot's folder, read by the harness, and `CLAUDE.md` holds `@AGENTS.md` | Softov, 2026-10-16, chose "AGENTS.md read by the harness" | p5 |
| Every bot session works in the bot's folder | Softov, 2026-10-16, chose "The bot's folder" | p3 |
| "Never does direct work" is a template choice, not every bot's rule | Softov, 2026-10-16, chose "A template choice" | p5, p7 |
| One task list on the host, and a task names its bot | Softov, 2026-10-16, chose "One host list, bot as a field" | p1 |
| No migration: the old harness session links are dropped | Softov, 2026-10-16, "ignore those. any migration process" | p2 |

## Proposed architecture

- **Data flow** - a message in a chat -> the `bot` trigger -> an automation -> a wake session -> `post_message` -> the chat.
- **State flow** - a chat's history is a log the chat provider keeps. The persona and the bot's notes are files in its folder. Tasks are records.
- **Layer responsibilities** - sdk: the sender on each turn, session members. bot: the chat provider, the trigger, `post_message`, templates. A new tasks plugin: the task list.

## Tasks

Child plans, each for one part.

| Plan | Package | Status | Depends on |
| --- | --- | --- | --- |
| [p1 - The host keeps one task list](../52-p1-the-host-keeps-one-task-list/plan.md) | tasks (new plugin), sdk | built | - |
| [p2 - A bot chat is a session with no harness](../52-p2-a-bot-chat-is-a-session-with-no-harness/plan.md) | bot, sdk | built | - |
| [p3 - A message wakes the bot and it replies](../52-p3-a-message-wakes-the-bot-and-it-replies/plan.md) | bot, sdk | active | p2 |
| [p4 - A group chat has members and mentions](../52-p4-a-group-chat-has-members-and-mentions/plan.md) | bot, sdk | dropped, in p14 | p3 |
| [p5 - A bot is made with its AGENTS.md](../52-p5-a-bot-is-made-with-its-agents-file/plan.md) | bot | dropped, in p3 | p3 |
| [p6 - A bot wakes when a session it started finishes](../52-p6-a-bot-wakes-when-a-session-it-started-finishes/plan.md) | bot | dropped, in p14 | p3 |
| [p7 - A manager bot edits only its own folder](../52-p7-a-manager-bot-edits-only-its-own-folder/plan.md) | bot | dropped, in the bots plan *A manager bot edits only its own folder* | p5, host/100 p2, host/101 |
| [p8 - AGENTS.md is the bot's one copy](../52-p8-agents-md-is-the-bots-one-copy/plan.md) | bot | active | p3 |
| [p9 - Front and Back are chats of one session](../52-p9-front-and-back-are-chats-of-one-session/plan.md) | bot | dropped, in p14 | p3, host/107 |
| [p10 - A bot changes bots with a tool](../52-p10-a-bot-changes-bots-with-a-tool/plan.md) | bot | dropped, in the bots plan *A bot changes bots with a tool* | p8 |
| [p11 - A bot has a private session](../52-p11-a-bot-has-a-private-session/plan.md) | bot | dropped, in p14 | p9 |
| [p12 - Claude and ACP write the task list](../52-p12-claude-and-acp-write-the-task-list/plan.md) | agent-claude, agent-acp, sdk, tasks | active | p1 |
| [p13 - A client sees the task list](../52-p13-a-client-sees-the-task-list/plan.md) | tasks, sdk | active | p1 |
| [p14 - A bot session has a Front, Backs and wakes](../52-p14-a-bot-session-has-a-front-and-backs/plan.md) | bot | dropped, in the bots plan *A bot session has a Front, Backs and wakes* | p3, host/107 |

## Risks and tradeoffs

- A turn that waits minutes for a wake can look stuck in a client. p3 decides what the open turn shows meanwhile.
- A message in a group is text from a person the owner may not trust. p14 names security tests for it.
- Each person's session is apart, so a bot does not remember one person's chat in another's. What they share goes through the bot's folder.

## Resume state

- **Done so far:** parent and seven child drafts written 2026-10-16. The `session:` lines were removed from the five bot files in `~/.config/ahpd/bots` on 2026-10-16.
- **Next action:** Softov reviews p3, p8, p12 and p13. Then the plan closes with `implemented.md` and `deferred.md`. The drafts p7, p10 and p14 moved to the `bots` domain on 2026-10-28. The *Tasks* table names the bots plan of each.
- **Open questions:** each child lists its own.
- **Watch out for:** `bot:/<slug>` is the record. A chat is a session of the chat provider, never a `bot:` URI.

## Final verification checklist

- [ ] Luiz and Maria each open a chat with Backer, and neither sees the other's.
- [ ] A message wakes a session in the bot's folder, and the reply arrives on the open turn.
- [ ] A chat shows its history after a daemon restart and after the bot's harness changes.
- [ ] In a group chat, `@backer` wakes Backer, and only members see the chat.
- [ ] VS Code opens a bot chat and sends a message in it.
- [ ] `docs/plugins/BOTS.md` updated.
