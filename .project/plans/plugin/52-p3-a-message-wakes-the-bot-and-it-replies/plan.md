---
title: A message wakes the bot and it replies
domain: plugin
status: draft
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugin/52-p2-a-bot-chat-is-a-session-with-no-harness/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L824](../../../../packages/sdk/src/types/plugin.ts#L824) - `registerTriggerType`, for the `bot` trigger"
  - "[code://packages/sdk/src/types/plugin.ts#L664](../../../../packages/sdk/src/types/plugin.ts#L664) - `registerTool`, for `post_message`"
  - "[code://packages/sdk/src/host/owners.ts#L22](../../../../packages/sdk/src/host/owners.ts#L22) - `senderOf`, the sender the host knows and a backend does not get"
  - "[code://packages/bot/src/start.ts#L26-L37](../../../../packages/bot/src/start.ts#L26-L37) - `sessionFor`, the wake session's request"
  - "[code://packages/sdk/src/types/agent.ts#L170-L182](../../../../packages/sdk/src/types/agent.ts#L170-L182) - `trusted`, which decides if Claude loads the bot folder's `CLAUDE.md`"
---

## Goal

A person's message in a direct chat fires the `bot` trigger, and an automation starts a wake session in the bot's folder.
The person's turn stays open until the wake calls `post_message`, whose text is the turn's response.
A second message while the bot works steers the running wake.
A wake that ends with no post closes the turn with a notice.
The host's bot rules go in as a system prompt where the harness takes one.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- A backend does not get the sender of a turn.
- No `bot` trigger type and no `post_message` tool.
- A plugin fire starts every automation that watches the type, not only the one for this bot.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The turn stays open until `post_message` | Softov, 2026-10-16, chose "Turn stays open" | - |
| A wake works in the bot's folder | Softov, 2026-10-16, chose "The bot's folder" | - |
| The host's bot rules are a system prompt where possible | Softov, 2026-10-16, chose "System prompt where possible" | - |
| Each person's chat has its own wake sessions | Softov, 2026-10-16, chose "One session per person" | - |

## Resume state

- **Done so far:** draft written 2026-10-16. No tasks yet.
- **Next action:** ask the open questions, then write the tasks.
- **Open questions:**
  1. Does the plugin make the bot's automation, or does a person - proposed: the plugin, when a bot is made.
  2. What does the open turn show while the wake works - proposed: "working", with a link to the wake.
  3. A wake's question or approval: shown in the chat, or left in the wake session with a link - proposed: shown in the chat.
  4. Is a person's next message a new wake session or a turn in the last one - proposed: a turn in that person's last wake session.
- **Watch out for:** `post_message` finds its chat from the wake's origin, never from an input, so a wake cannot post as another bot.
