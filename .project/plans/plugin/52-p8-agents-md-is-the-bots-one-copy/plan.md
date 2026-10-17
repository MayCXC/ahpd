---
title: AGENTS.md is the bot's one copy
domain: plugin
status: planned
priority: medium
created: 2026-10-17
revalidated: 2026-10-17
requires:
  - plans/plugin/52-p3-a-message-wakes-the-bot-and-it-replies/plan.md
changes: []
creates: []
refs:
  - "[code://packages/bot/src/record.ts#L84-L90](../../../../packages/bot/src/record.ts#L84-L90) - `description` and `instructions` on the bot record"
  - "[code://packages/bot/src/plugin.ts#L143](../../../../packages/bot/src/plugin.ts#L143) - the `bots` collection, whose body is `instructions`"
  - "[code://packages/bot/src/template.ts#L131-L137](../../../../packages/bot/src/template.ts#L131-L137) - `agentsFilled`, which copies the record into the file once"
  - "[code://packages/bot/src/folder.ts](../../../../packages/bot/src/folder.ts) - `prepareFolder`, which writes `AGENTS.md` when it is absent"
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - the read, write and delete roads of a bot"
---

## Goal

A bot's persona has one copy: the `AGENTS.md` in its folder.
The file has a frontmatter with `version`, `name` and `description`, and a `## Instructions` section.
The UI reads and edits only those parts, and the bot owns the rest of the file.
An edit in the UI changes the file, so the next back session reads it.
An edit by the bot changes the file, so the UI shows it.
A bot on a computer keeps an edit made while the computer is offline, and writes it when the computer is back.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- The record and `AGENTS.md` both hold the persona, and nothing keeps them the same.
- `AGENTS.md` is written only at the first wake, so an edit in the UI after it goes nowhere.
- An edit by the bot to `AGENTS.md` does not show in the UI.
- The file has no parts that a parser can find.
- The host cannot read the folder of a bot on a computer.
- A delete of a bot leaves its rows in `bot-chats/` and `bot-sessions/`, and its chat logs.
- A record collection name is a slug, so a plugin cannot keep a collection in a subfolder.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `AGENTS.md` is the one copy of the persona, and the UI edits only its frontmatter and its `## Instructions` section | Softov, 2026-10-17, "make like a parser for the AGENTS.md? Extract ## Instructions ... only allow user to edit on ui the ## Instructions and what comes before", then "Yes, plan it" | 01, 02 |
| The frontmatter holds `version`, `name` and `description` | Softov, 2026-10-17, "AGENTS.md can have also a simple frontmatter, version, name, description?" | 01 |
| `version` is the version of the file's layout | (defaulted: a parser tells an old layout from a new one) | 01 |
| A section the bot removed reads as empty, and an edit in the UI writes it again | (defaulted: the bot owns the rest of the file and can break it) | 01 |
| The wire shape of a bot does not change, so a client needs no change | (defaulted: the provider reads the parts from the file) | 02 |
| An edit to a computer bot while the computer is offline waits, and the next back session start writes it | Softov, 2026-10-17, "Its possible to make like a pending sync? For when offline?" | 03 |
| All the data of one bot is in `bots/<slug>/`, and a delete removes that folder | Softov, 2026-10-17, chose "One folder per bot" for "Deleting a bot leaves its rows in bot-chats/ and bot-sessions/, its chat logs, and its folder. Which fix?" | 05 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - AGENTS.md has parts the UI owns](task-01-agents-md-has-parts-the-ui-owns.md) | implemented | - |
| [02 - A bot's persona is read from and written to its AGENTS.md](task-02-the-persona-is-read-from-agents-md.md) | todo | 01 |
| [03 - An edit to a computer bot waits for the computer](task-03-an-edit-to-a-computer-bot-waits.md) | todo | 02 |
| [04 - The docs say where a bot's persona is](task-04-the-docs-say-where-the-persona-is.md) | todo | 02, 03, 05 |
| [05 - A bot's data is one folder](task-05-a-bots-data-is-one-folder.md) | todo | 02 |

## Risks and tradeoffs

- The bot can rewrite its file in any shape. The parser takes what it finds and never refuses a file.
- A list of bots reads one file for each bot. A list is short, so this costs little.
- A computer bot shows its last known parts while the computer is offline.

## Resume state

- **Done so far:** planned 2026-10-17. Task 01 is implemented: the parser and the writer are in `packages/bot/src/agents.ts`, and the default text is in `packages/bot/src/template.ts`. The provider does not use them yet.
- **Next action:** build [task-02-the-persona-is-read-from-agents-md.md](task-02-the-persona-is-read-from-agents-md.md).
- **Open questions:**
  1. The text of the default template - proposed: the text in task 01, which Softov refines.
  2. How a plugin keeps records in `bots/<slug>/` - proposed: `records` takes a path of slugs under the plugin's own collection.
- **Watch out for:** a bot's `AGENTS.md` today has no frontmatter. Task 02 moves its parts into the new layout and keeps the bot's own text.
