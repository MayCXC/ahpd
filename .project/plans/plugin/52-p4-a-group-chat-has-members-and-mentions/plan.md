---
title: A group chat has members and mentions
domain: plugin
status: draft
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugin/52-p3-a-message-wakes-the-bot-and-it-replies/plan.md
changes: []
creates: []
refs:
  - "[code://docs/sdk/SESSIONS.md](../../../../docs/sdk/SESSIONS.md) - session grants are by role, and a session has no member list"
  - "[code://packages/sdk/src/host/routing.ts#L46](../../../../packages/sdk/src/host/routing.ts#L46) - a chat session is routed like any session, so VS Code lists it"
---

## Goal

A group chat is a session of the chat provider with a member list of people and bots.
Only members see the chat and send to it, in every client, VS Code included.
`@<slug>` in a person's message wakes that bot, and a bot's own post wakes nobody.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- A session has no member list, and access is by role grants for every session.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A group chat is a session for now | Softov, 2026-10-16, "can be a session for now" | - |
| A group chat has members, and only they reach it | Softov, 2026-10-16, chose "Members on the chat session" | - |
| Only `@<slug>` wakes a bot | Softov, 2026-10-16, chose "Only @backer" | - |

## Resume state

- **Done so far:** draft written 2026-10-16. No tasks yet.
- **Next action:** ask the open questions, then write the tasks.
- **Open questions:**
  1. Who may add a member - proposed: the chat's owner.
  2. May a bot read a group where nobody mentioned it - proposed: no, a wake gets only the messages since its last post.
- **Watch out for:** a message in a group is text from a person the bot's owner may not trust. Name security tests for it.
