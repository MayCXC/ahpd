---
title: A bot is made with its AGENTS.md
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
  - "[code://packages/bot/src/template.ts](../../../../packages/bot/src/template.ts) - `DEFAULT_TEMPLATE`, which becomes the bot maker"
  - "[code://packages/bot/src/plugin.ts#L57](../../../../packages/bot/src/plugin.ts#L57) - the `templates` collection"
  - "[code://packages/agent-claude/src/session/query.ts#L320](../../../../packages/agent-claude/src/session/query.ts#L320) - Claude loads `CLAUDE.md` only from a trusted folder"
---

## Goal

A new bot's folder gets `AGENTS.md` and a `CLAUDE.md` that holds `@AGENTS.md`.
Each harness reads `AGENTS.md` itself, and the bot rewrites it when it needs to.
The default template is the bot maker: its first chat asks the owner what the bot is for and writes `AGENTS.md`.
A manager template ships with ahpd, and the maker copies its text into `AGENTS.md` when the owner picks it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- The plugin writes no file in the bot's folder.
- The default template does not ask the owner anything.
- No manager template ships with ahpd.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `AGENTS.md` is the persona, read by the harness, and `CLAUDE.md` holds `@AGENTS.md` | Softov, 2026-10-16, chose "AGENTS.md read by the harness" | - |
| The bot rewrites its own `AGENTS.md` | Softov, 2026-10-16, "AGENTS.md will need a rewrite right. When bot desires" | - |
| The plugin marks only the bot's own folder as trusted | Softov, 2026-10-16, chose "Yes, own folder only" | - |
| The manager text is copied into `AGENTS.md`, so an ahpd update does not change a bot that exists | Softov, 2026-10-16, chose "Copied into AGENTS.md" | - |
| "Never does direct work" is a template choice | Softov, 2026-10-16, chose "A template choice" | - |

## Resume state

- **Done so far:** draft written 2026-10-16. No tasks yet.
- **Next action:** ask the open questions, then write the tasks.
- **Open questions:**
  1. Does the record's `instructions` field stay, as the seed of `AGENTS.md` - proposed: yes, seed only.
  2. Does the maker run in the owner's direct chat - proposed: yes, as its first wake.
- **Watch out for:** a file the owner wrote in the bot's folder is never overwritten. The plugin writes `AGENTS.md` and `CLAUDE.md` only when they are absent.
