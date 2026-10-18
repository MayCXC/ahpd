---
title: AGENTS.md is the bot's one copy
domain: plugin
status: active
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
| A plugin reads YAML with the host's `parseYaml` and `stringifyYaml`, and has no YAML dependency of its own | Softov, 2026-10-17, "Server could expose the yaml call for plugins right?", then "plan and implement" | 06 |
| An edit to a computer bot while the computer is offline waits, and the next back session start writes it | Softov, 2026-10-17, "Its possible to make like a pending sync? For when offline?" | 03 |
| All the data of one bot is in `bots/<slug>/`, and a delete removes that folder | Softov, 2026-10-17, chose "One folder per bot" for "Deleting a bot leaves its rows in bot-chats/ and bot-sessions/, its chat logs, and its folder. Which fix?" | 05 |
| The record is `bots/<slug>/bot.md` in a `file` collection, and the chat and session rows are the collections `bots/<slug>/chats` and `bots/<slug>/sessions` | Softov, 2026-10-17, chose "Update and build" for "Update p8 task 05 to this design (collections at a subpath, three per bot) and build it?" | 05 |
| Task 03 waits, and task 04 does not wait for it | Softov, 2026-10-17, chose "Leave task 03 for later" | 03, 04 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - AGENTS.md has parts the UI owns](task-01-agents-md-has-parts-the-ui-owns.md) | implemented | - |
| [02 - A bot's persona is read from and written to its AGENTS.md](task-02-the-persona-is-read-from-agents-md.md) | implemented | 01, 06 |
| [03 - An edit to a computer bot waits for the computer](task-03-an-edit-to-a-computer-bot-waits.md) | todo | 02 |
| [04 - The docs say where a bot's persona is](task-04-the-docs-say-where-the-persona-is.md) | todo | 02, 05 |
| [05 - A bot's data is one folder](task-05-a-bots-data-is-one-folder.md) | implemented | 02 |
| [06 - AGENTS.md uses the host's YAML](task-06-agents-md-uses-the-hosts-yaml.md) | implemented | 01 |

## Risks and tradeoffs

- The bot can rewrite its file in any shape. The parser takes what it finds and never refuses a file.
- A list of bots reads one file for each bot. A list is short, so this costs little.
- A computer bot shows its last known parts while the computer is offline.

## Resume state

- **Done so far:** planned 2026-10-17. Tasks 01, 02, 05 and 06 are implemented. The parser and the writer are in `packages/bot/src/agents.ts`, and the default text is in `packages/bot/src/template.ts`. `AGENTS.md` is the one copy of a bot's persona. A make writes the file from the template, and an edit writes the UI's parts into it. The store keeps no persona in a record it puts. At load, the store moves the persona of an older record into its file. Task 05 is implemented. A collection name is a path of one to three slugs, and the plugin claim is on the first slug. `CollectionOptions.file` keeps record `<id>` at `<name>/<id>/<file>.md`. All of one bot's data is in `<configDir>/bots/<slug>/`, with `bot.md`, `chats/`, `sessions/` and `logs/`. A load moves `bots/<slug>.md`, `bot-chats/` and `bot-sessions/` into the bot's folder. It removes the data of tombstoned bots, and reports a file it cannot place. A delete writes the tombstone and then removes `bots/<slug>/`; the bot's work folder is left alone.
- **Next action:** build [task-04-the-docs-say-where-the-persona-is.md](task-04-the-docs-say-where-the-persona-is.md), which now has its dependency 05. Task 03 waits for a later session.
- **Open questions:**
  1. The text of the default template - proposed: the text in task 01, which Softov refines.
- **Watch out for:** read a bot through the store's `BotRecord` or `fromAgents`, and never as a raw collection record. A computer bot keeps its persona in its record until task 03. A store with no YAML writes no file and keeps the persona in the record. The `bots` collection keeps `body: 'instructions'`, because an older record has its instructions in the Markdown body. `@cofold/yaml` is a `devDependency` of `packages/bot` for the tests only. One plugin owns a first slug and every path under it, so `bots/<slug>/chats` and `bots/<slug>/sessions` are opened by the bot plugin alone. A `file` collection lists only subfolders that hold `<file>.md`, so `chats/`, `sessions/` and `logs/` beside `bot.md` are not records. The chat agent scans every bot's `logs/` folder, because a log is found by its chat id and the folder says which bot. A wake finds a chat's bot by asking each bot's `chats` collection, since a message names only its session. A test host needs the plugin grant `session:trust`, or every back session start is refused naming the grant.
