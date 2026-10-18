---
title: A bot changes bots with a tool
domain: plugin
status: draft
priority: medium
created: 2026-10-18
revalidated: 2026-10-18
requires:
  - plans/plugin/52-p8-agents-md-is-the-bots-one-copy/plan.md
changes:
  - specs/bots.md
creates: []
refs:
  - "[code://packages/bot/src/provider.ts#L700-L740](../../../../packages/bot/src/provider.ts#L700-L740) - the `bot://<slug>` write, with the checks a tool reuses"
  - "[code://packages/bot/src/wake.ts#L202-L215](../../../../packages/bot/src/wake.ts#L202-L215) - `sessionFor`: a Back runs as the bot's owner and names its tools"
  - "[code://packages/bot/src/post.ts#L44-L80](../../../../packages/bot/src/post.ts#L44-L80) - `post_message`, the opt-in host tool to copy"
---

## Goal

A bot can make a bot and change a bot's record with a tool.
It can change the name, colour, description, instructions and `AGENTS.md`, of itself or of another bot.
A bot can do no more than its owner: the tool writes with the owner's grants and the same checks as a person's write.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- A Back has no tool to write a bot record, so a bot edits `AGENTS.md` with the harness's edit tool and nothing checks the text.
- A change a bot makes is not told apart from a change its owner makes.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A bot gets tools to change bot records, of itself and of other bots | Softov, 2026-10-18, chose "Bot profile tools" | - |
| A bot can do no more than its owner | Softov, 2026-10-18, "Basically the bot can't do more than its owner. If a owner can create bots, the bot can also create bots." | - |

## Resume state

- **Done so far:** draft written 2026-10-18. No tasks yet.
- **Next action:** ask the open questions, then write the tasks.
- **Open questions:**
  1. The tool names - proposed: `bot_create` and `bot_update`, opt-in like `post_message`.
  2. A grant to narrow a bot below its owner - proposed: not now; the owner's grants only, and a grant later can only narrow.
  3. How a change by a bot is recorded - proposed: the record's change carries the bot as the actor, beside the owner.
- **Watch out for:** a group message can come from people the owner does not trust. A mention must not let them change bots.
