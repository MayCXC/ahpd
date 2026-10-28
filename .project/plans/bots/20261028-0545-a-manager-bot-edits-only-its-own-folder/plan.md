---
title: A manager bot edits only its own folder
domain: bots
status: draft
priority: medium
created: 2026-10-16
revalidated: 2026-10-28
requires:
  - plans/plugin/52-p3-a-message-wakes-the-bot-and-it-replies/plan.md
  - plans/host/100-p2-a-session-gets-its-owners-command-check/plan.md
  - plans/host/101-a-rule-makes-a-tool-call-ask-every-time/plan.md
changes: []
creates: []
refs:
  - "[code://packages/bot/src/wake.ts#L221-L234](../../../../packages/bot/src/wake.ts#L221-L234) - `sessionFor`, which sets no permission mode"
  - "[code://.project/plans/plugin/52-p7-a-manager-bot-edits-only-its-own-folder/plan.md](../../../../.project/plans/plugin/52-p7-a-manager-bot-edits-only-its-own-folder/plan.md) - the draft this plan replaces"
---

## Goal

A wake session of a manager bot refuses an edit, a write or a command outside the bot's folder.
The sessions that it starts keep their own rules, so they can work in the project.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Gaps

- A wake session has the same tools and rules as any session.
- Rules for tool calls and commands come with host/100 and host/101.

## Answers

| What | Source | Task |
| --- | --- | --- |
| "Never does direct work" applies to bots made from the manager template | Softov, 2026-10-16, chose "A template choice" | - |

## Resume state

- **Done so far:** moved from plugin/52 p7 on 2026-10-28, when Softov made the `bots` domain. The draft was written 2026-10-16. No tasks yet. The permission mode of a Back moved to [A bot session has a Front, Backs and wakes](../20261028-0545-a-bot-session-has-a-front-and-backs/plan.md) on 2026-10-22.
- **Next action:** wait for host/100 p2 and host/101, then write the tasks.
- **Open questions:**
  1. Does a refused call stop the turn or tell the agent why - proposed: tell the agent, so it delegates instead.
- **Watch out for:** a read outside the folder is allowed, because a manager reads code to plan.
