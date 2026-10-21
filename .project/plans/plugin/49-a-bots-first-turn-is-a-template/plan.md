---
title: A bot's first turn is a template
domain: plugin
status: built
priority: medium
created: 2026-10-13
revalidated: 2026-10-14
requires:
  - plans/plugin/45-p2-the-bot-keeps-its-records-there/plan.md
refs:
  - "[code://packages/bot/src/start.ts#L27-L38](../../../../packages/bot/src/start.ts#L27-L38) - `sessionFor`, which sends `instructions` as the first turn"
  - "[code://packages/bot/src/record.ts#L52-L86](../../../../packages/bot/src/record.ts#L52-L86) - `BotRecord`, the facts a template fills in"
  - "[code://packages/sdk/src/automations/wakemessage.ts#L34-L62](../../../../packages/sdk/src/automations/wakemessage.ts#L34-L62) - the `{{word}}` filler, which leaves a name it does not know as written"
  - "[code://packages/sdk/src/types/plugin.ts#L718](../../../../packages/sdk/src/types/plugin.ts#L718) - `registerMethod`, beside which the chat preamble hook goes"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1042-L1160](../../../../packages/sdk/src/host/sessionmethods.ts#L1042-L1160) - `createChat`, which runs `initialMessage` right after `session/chatAdded`"
---

## Goal

A bot's first turn is built from a template, not from its instructions alone.
The template gives the bot its name, its instructions and its last chats.
The bot plugin ships a default template, and a bot can name another.
Each new chat of the bot starts with the template filled again, so a bot never starts a chat without its context.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "instructions" packages/bot/src` - the instructions are the first turn and nothing else.
- `rg "\{\{" packages/sdk/src` - one filler exists, for wake messages.

### Runtime path

```
bot made, or a chat added to its session -> read template -> fill {{word}} -> first turn of that chat
```

### Gaps

- A bot has no template field.
- A new chat of a bot's session starts empty.
- The filler knows only the wake's words.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| A bot names a template as `template: <name>` in its frontmatter, read from `<configDir>/templates/<name>.md` | Softov, 2026-10-13, "Named file, default shipped" | 01 |
| The plugin ships a default template, used when a bot names none | Softov, 2026-10-13, "Named file, default shipped" | 01 |
| `{{instructions}}` places the bot's body in the template | Softov, 2026-10-13, "Named file, default shipped" | 01 |
| The template is filled on every new chat of the bot | Softov, 2026-10-13, "Every new chat" | 03 |
| The filler is the wake filler, given more words | (defaulted: one filler in the host) | 01 |
| The last sessions are the bot's chats, newest first, with their titles | (defaulted: a bot has one session) | 01 |
| A template is a record in the `templates` collection, read with `host.records('templates', { body: 'text' })`; its frontmatter holds `title`, and its body is the text the words fill | Softov, 2026-10-14, to "How does the plugin read a template?" - "The template will have frontmatter. I said that before." No earlier statement is in `.project`; decision `a-plugin-keeps-records-in-the-host-store` is the rule it follows | 01 |
| A bot write that names a template that does not exist is refused, with a sentence that names the missing template | Softov, 2026-10-14, to "What happens when the named template file does not exist?" - "Refuse the bot's write" | 01 |
| `{{chats}}` lists the bot's last chats newest first, as many as the plugin option `lastChats` says, 10 by default | Softov, 2026-10-14, to "How many chats does `{{chats}}` list?" - "Plugin option, default 10" | 01 |
| The template has no `{{pending}}` word, and the plugin reads no `PENDING.md`; [deferred.md](deferred.md) keeps the word | Softov, 2026-10-14, to "Keep `{{pending}}`, filled from a file the bot keeps in its workspace?" - "Drop {{pending}} for now". It replaces his answer "Read it through the computer" | 01 |
| A new chat gets the template when a person or a tool opens it: a client `createChat`, a side chat, or the `createChat` tool; a fork, a subagent worker chat and a changeset chat do not | Softov, 2026-10-14, to "Which new chats get the template?" - "Chats a person or tool opens" | 02, 03 |
| A fork gets no preamble, because it resumes a conversation that already began with one | Softov, 2026-10-14, to "Should the fork get the template preamble again?" - "No, skip on a fork" | 02 |
| A chat opened with `initialMessage` gets the template first, then the initial message | Softov, 2026-10-14, to "Which new chats get the template?" - "Chats a person or tool opens" | 02 |
| A plugin registers a chat preamble, and the host places its text before the first turn of a chat that a person or a tool opens, `initialMessage` included; only the bot plugin uses it | Softov, 2026-10-14, to "How does the template come before `initialMessage`?" - "Host hook for a new chat's preamble" | 02, 03 |
| A new chat whose bot's template was deleted after the bot was written gets the default template, and the plugin reports a problem | Softov, 2026-10-14, to "What does a new chat get when its bot's template was deleted after the bot was written?" - "Default template, report a problem" | 03 |
| An edit that does not name `template` passes when the bot's kept template was deleted; the bot's next chat gets the default template and the plugin reports a problem that names it | Softov, 2026-10-14, to "Should an edit that does not name `template` be refused when the bot's kept template was deleted?" - "Let it pass, flag a problem" | 01 |
| The host puts a preamble in the hidden `context` of the chat's first turn, before `initialMessage`; no turn runs until someone writes | Softov, 2026-10-14, to "Where does the host place a preamble?" - "Hidden first-turn context" | 02, 03 |
| A changeset chat keeps the origin the protocol allows, and the host never asks the preamble hook from `changesets.ts` or `spawn.ts` | Softov, 2026-10-14, to "How does the bot tell a changeset chat from a side chat, when `ChatOriginKind` is closed?" - "Keep origin, hook skips it". It replaces his answer "Changeset chats get their own kind" | 02 |

## Proposed architecture

- **Data flow** - `sessionFor` asks for the filled template, not the bare instructions. The words are `name`, `description`, `instructions` and `chats`.
- **Event flow** - A person or a tool opens a chat, and the host asks each chat preamble. The bot plugin answers the filled template.
- **Layer responsibilities** - bot: the template field, the reading, the preamble · sdk: the filler, the chat preamble · docs: BOTS.md, PLUGINS.md.
- **Source-of-truth files** - [`code://packages/bot/src/start.ts`](../../../../packages/bot/src/start.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A bot's first turn is its filled template](task-01-a-bots-first-turn-is-its-filled-template.md) | done | - |
| [02 - A plugin gives a new chat's preamble](task-02-a-plugin-gives-a-new-chats-preamble.md) | done | - |
| [03 - Each new chat of a bot starts with the template](task-03-new-bot-chat-starts-with-the-template.md) | done | 01, 02 |

## Risks and tradeoffs

- A short question gets the whole template first - The default template is short, and a bot can name a shorter one.

## Resume state

- **Done so far:** the plan, 2026-10-13; the task files, 2026-10-14; Softov's answers to eleven questions, 2026-10-14; tasks 01, 02 and 03 implemented, 2026-10-14. Task 02 of the first draft became tasks 02 and 03, for the host hook and the bot's use of it.
- **Next action:** none. Built 2026-10-15; see [implemented.md](implemented.md).
- **Open questions:** none. Softov answered the task 01 question on 2026-10-14.
- **Watch out for:**
  - The first chat opens with the session and not through `createChat`, so it gets the template once.
  - Plugin 37 opened a silent session for a bot with no instructions, but a template always gives a first turn.
  - The store does not check optional fields of a hand-edited bot, so the reader checks the template name with `isSlug`.
  - The docs file is `docs/plugins/BOTS.md`, not `BOT.md`.

## Final verification checklist

- [x] `pnpm vitest run packages/bot packages/sdk` passes.
- [x] `pnpm -s typecheck` passes.
- [x] `plans/index.md` updated.
