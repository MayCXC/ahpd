---
title: "`ahpd paths list`, `add` and `remove` change the served folders with no question"
status: accepted
date: 2026-10-14
refs:
  - "[code://packages/server/src/commands/configure.ts#L309-L321](../../packages/server/src/commands/configure.ts#L309-L321) - `askToServe`, which adds a folder to `paths` only after a question"
  - "[code://packages/server/src/commands/options.ts#L991](../../packages/server/src/commands/options.ts#L991) - `--path`, which serves a folder for one run only"
---

## Context

A client such as ahp-desk sets the folder of a new host in its Add host step, before or after the daemon starts.
Today only `ahpd configure` and the question at `ahpd start` write `paths`, and both ask at a terminal.
`--path` serves a folder for one run and writes nothing.

## Decision

`ahpd paths list` shows the served folders, `ahpd paths add <folder>` adds one, and `ahpd paths remove <folder>` removes one.
Each verb writes `paths` in `config.json` and asks nothing.
Each verb takes `--json`, and is declared in the command registry, so the daemon also serves it over HTTP.

Source: Softov, 2026-10-14, asked what shape the command takes: "ahpd paths list/add/remove".

## Consequences

A client sets a host's folders with one command, with no terminal.
The question at `ahpd start` and in `ahpd configure` stays for a person at a terminal.

## Options

- **`ahpd paths add` only**: the Add host step needs only this verb. A person then removes a folder by an edit of `config.json`.
