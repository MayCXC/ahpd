---
title: A bot wakes when a session it started finishes
domain: plugin
status: dropped
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugin/52-p3-a-message-wakes-the-bot-and-it-replies/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/types/triggers.ts#L24](../../../../packages/sdk/src/types/triggers.ts#L24) - the `childFinished` event kind"
  - "[code://packages/sdk/src/host/sessionevents.ts#L160-L171](../../../../packages/sdk/src/host/sessionevents.ts#L160-L171) - the host emits `childFinished` on the parent session"
  - "[code://packages/sdk/src/tools/session.ts#L447](../../../../packages/sdk/src/tools/session.ts#L447) - `create_session`, whose relationship decides the parent"
---

Dropped 2026-10-22: merged into [p14 - A bot session has a Front, Backs and wakes](../52-p14-a-bot-session-has-a-front-and-backs/plan.md).

## Goal

When a session that a wake started finishes, a new wake session starts in the bot's folder.
It reviews the work, updates the task, and posts to the chat the work came from.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- No bot listens to `childFinished`.
- An `independent` session from `create_session` may have no parent, so the event may not reach the bot.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A wake with no person behind it starts a new session per fire | Softov, 2026-10-16, chose "No, new per fire" | - |

## Resume state

- **Done so far:** draft written 2026-10-16. No tasks yet.
- **Next action:** read how an `independent` session records its creator, then ask the open questions.
- **Open questions:**
  1. How does the wake know which chat to post to - proposed: the task names the chat.
- **Watch out for:** two sessions that finish together give two wakes, not one lost wake.
