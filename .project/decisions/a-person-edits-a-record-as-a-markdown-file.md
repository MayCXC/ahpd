---
title: A bot or an automation is one Markdown file with YAML frontmatter
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/bot/src/store.ts](../../packages/bot/src/store.ts) - `botStore`, one JSON file per bot today"
  - "[code://packages/sdk/src/scheduled.ts](../../packages/sdk/src/scheduled.ts) - `scheduledAutomations`, one JSON file for every automation today"
  - npm://@cofold/yaml@^0.2.0 - `parseYaml`, and the writer cofold plan commands/05 adds
---

## Context

A bot's `instructions` and an automation's message are long text.
In JSON, that text is one escaped line, and a person cannot read or edit it.
All automations are in one file, so a person cannot copy, paste or install one automation alone.

## Decision

Each bot and each automation is one Markdown file.
The YAML frontmatter holds the fields, and the body holds the long text: a bot's `instructions`, an automation's message text.
The daemon reads YAML with `@cofold/yaml` and writes it with the `stringifyYaml` that cofold plan commands/05 adds.

Source: Softov, 2026-10-10, to "What format should a bot or automation file use?" - "cofold has yaml"; and to "How should automations be stored?" - "One file each".

## Consequences

A person reads, edits, copies and installs one bot or one automation as one file.
ahpd depends on `@cofold/yaml`, and it can use the writer only after cofold publishes it.
A record that has no long text has an empty body.

## Options

- **JSON, as today.** Rejected: long text is one escaped line.
- **A plain `.yaml` file.** Rejected: the long text is a block scalar inside the record, not a body a person edits as text.
- **A YAML parser written in ahpd, or the `yaml` package.** Rejected: cofold already has a parser, and the writer goes beside it.
- **One file for all automations.** Rejected: a person cannot copy or install one automation alone.
