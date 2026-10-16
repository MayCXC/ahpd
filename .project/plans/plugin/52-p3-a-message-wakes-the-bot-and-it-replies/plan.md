---
title: A message wakes the bot and it replies
domain: plugin
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugin/52-p2-a-bot-chat-is-a-session-with-no-harness/plan.md
changes: []
creates: []
refs:
  - "[code://packages/bot/src/chat.ts](../../../../packages/bot/src/chat.ts) - the `bot-chat` agent, whose turn ends at once"
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - `chatOf` and the `bot-chats` rows, the pattern for the back sessions"
  - "[code://packages/bot/src/template.ts](../../../../packages/bot/src/template.ts) - `templateOf` and `firstTurn`, which no code calls yet"
  - "[code://packages/sdk/src/types/plugin.ts#L664](../../../../packages/sdk/src/types/plugin.ts#L664) - `registerTool`, for `post_message`"
  - "[code://packages/sdk/src/types/host.ts#L676-L680](../../../../packages/sdk/src/types/host.ts#L676-L680) - `HostTool.run` and its `ToolCall`, which names the calling session"
  - "[code://packages/sdk/src/types/events.ts#L144-L168](../../../../packages/sdk/src/types/events.ts#L144-L168) - `input_needed_set` and `input_needed_removed`, a back session's questions"
  - "[code://packages/sdk/src/host/spawn.ts#L339-L436](../../../../packages/sdk/src/host/spawn.ts#L339-L436) - `openSubagent`, how a call links a worker chat"
  - "[code://packages/sdk/src/host/calllinks.ts#L30](../../../../packages/sdk/src/host/calllinks.ts#L30) - `_meta.toolKind: 'subagent'` makes a call a spawning call"
  - "[code://packages/sdk/src/types/agent.ts#L238](../../../../packages/sdk/src/types/agent.ts#L238) - `Start.instructions`, which Claude and pi append to the system prompt"
  - "[code://packages/webhook/src/plugin.ts#L66-L98](../../../../packages/webhook/src/plugin.ts#L66-L98) - how a plugin dispatches a turn or a steer through its peer"
---

## Goal

A person's main chat with a bot is named `bot:/<bot>/<user>`, and it runs no harness.
Behind it are back sessions, each named `bot:/<bot>/<user>/<name>` and each on the bot's harness.
A message in the main chat goes to a back session as a turn, or as a steer when that session works.
When no back session has the name, the message starts one.
The bot's template says the name, so a bot continues one back session or starts a new one for each message.
The main turn stays open and shows the back session as a subagent call, until the back session calls `post_message`.
A back session's question or approval is shown in the main chat, as a subagent's question is shown in its parent.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- `bot-chat` ends every turn in the call that starts it, so no turn stays open.
- No name addresses a main chat or a back session: a main chat is `bot-chat:/<uuid>`.
- No `post_message` tool.
- A call links only a worker chat in its own session, not a chat in another session.
- Nothing shows one session's question in another chat.
- A session request has no system prompt, so the bot's rules cannot reach the harness.

## Answers

| What | Source | Task |
| --- | --- | --- |
| No automation: a message in the main chat wakes a back session directly | Softov, 2026-10-16, "automation were not the main idea", then "ok continue" on the corrected model | 03 |
| The main chat is `bot:/<bot>/<user>`, and a back session is `bot:/<bot>/<user>/<name>` | Softov, 2026-10-16, "bot:/{bot}/{user} is the fucking main session for a user", "bot:/{bot}/{user}/xyz for others" | 01 |
| The template says the back session's name, to continue one or start a new one | Softov, 2026-10-16, "the idea is to choise a running session or a new one if desired" | 03 |
| A back session's question or approval goes to its main chat, as a subagent's does | Softov, 2026-10-16, "when a `template session` has a question, it goes to main chat with that session" | 06 |
| The main turn stays open until `post_message` | Softov, 2026-10-16, chose "Turn stays open" | 02, 04 |
| The open main turn shows the back session as a subagent call, as ahpapp draws one | Softov, 2026-10-16, answered "Working. subagent on top like ahpapp?" for "What does your open turn show while the wake works?" | 05 |
| A back session works in the bot's folder | Softov, 2026-10-16, chose "The bot's folder" | 03 |
| The host's bot rules are a system prompt where possible | Softov, 2026-10-16, chose "System prompt where possible" | 07 |
| The default name is `work`, so a person continues one back session | (defaulted: "its one for user") | 03 |
| A name may hold `{turn}`, which gives a new back session for each message | (defaulted: one word for "a new one if desired") | 03 |
| `<user>` is the id after `user:`, and the host's name for a reader who is nobody | (defaulted: `chatOf` keys on the owner the same way) | 01 |
| A back session is owned by the person of its main chat | (defaulted: the person reads and answers their own back session) | 03 |
| The system prompt is the bot's filled template, with what `post_message` is for | (defaulted: `firstTurn` fills the template and no code calls it) | 07 |
| A back session that ends its turn with no post closes the main turn with a notice | (defaulted: the draft's goal) | 04 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A main chat and its back sessions have names](task-01-a-main-chat-and-its-back-sessions-have-names.md) | implemented | - |
| [02 - A main turn stays open](task-02-a-main-turn-stays-open.md) | todo | - |
| [03 - A message wakes a back session](task-03-a-message-wakes-a-back-session.md) | todo | 01, 02 |
| [04 - post_message ends the main turn](task-04-post-message-ends-the-main-turn.md) | todo | 03 |
| [05 - The main turn shows the back session as a subagent](task-05-the-main-turn-shows-the-back-session.md) | todo | 03 |
| [06 - A back session's question is asked in the main chat](task-06-a-back-sessions-question-is-asked-in-the-main-chat.md) | todo | 05 |
| [07 - The bot's rules are the system prompt](task-07-the-bots-rules-are-the-system-prompt.md) | todo | 03 |
| [08 - The docs say how a bot wakes](task-08-the-docs-say-how-a-bot-wakes.md) | todo | 04, 05, 06, 07 |

## Risks and tradeoffs

- A host can hold thousands of back sessions. They are ordinary sessions, so the session list shows them.
- ACP takes no system prompt, so an ACP bot gets its rules in the first message of a back session.

## Resume state

- **Done so far:** draft written 2026-10-16. Planned 2026-10-16 with eight tasks. Task 01 implemented 2026-10-16, uncommitted: `packages/bot/src/names.ts` (new) holds `userOf`, `whose`, `named`, `rowId` and the `backSessions` seam over the `bot-sessions` collection; the read, list and resolve roads of `packages/bot/src/provider.ts` take the paths under a bot, so a read of `bot://<slug>/<user>` answers `{ chat }`, a read of `bot://<slug>/<user>/<name>` answers `{ session }` or is not found, a list of `bot://<slug>/<user>/` answers the names, and looking into them is refused to anyone but that person, the bot's owner and this host; `chatRow` is `rowId` now, and `packages/bot/src/plugin.ts` opens the collection. `packages/bot/test/bot-names.test.ts` (new) is the eight cases. The gates pass: schema, build, typecheck, boundary and `git diff --quiet tools/`; vitest over bot, sdk, server and webhook is 4275 tests over 217 files, all passing. One line outside the task's files: `packages/bot/test/bot-store.test.ts` gained the new provider option. The suite left `packages/sdk/test/fixtures/wire.jsonl` dirty, which no gate here may restore: `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
- **Next action:** build task 02.
- **Open questions:** none.
- **Watch out for:** `post_message` finds its main chat from the calling session, never from an input, so a back session cannot post as another bot.
- **Watch out for:** p2's main chat is a `bot-chat:/<uuid>` session. Task 01 gives it the name `bot:/<bot>/<user>`, and the session URI stays as it is.

## Final verification checklist

- [ ] A test: a message in a main chat starts a back session, and a second message is a turn in the same one.
- [ ] A test: a name with `{turn}` starts a new back session for each message.
- [ ] A test: `post_message` ends the main turn with its text, and a back session cannot post into another chat.
- [ ] A test: a back session's question is answered from the main chat.
- [ ] The gates pass: build, typecheck, boundary, schema and vitest.
- [ ] By hand: in ahpw, a message to a bot gets a reply, and the subagent call opens the back session.
- [ ] `docs/plugins/BOTS.md` and `plans/index.md` updated.
