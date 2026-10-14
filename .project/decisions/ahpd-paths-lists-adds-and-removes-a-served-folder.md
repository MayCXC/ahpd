---
title: "`ahpd paths list`, `add` and `remove` change the served folders"
status: accepted
date: 2026-10-14
refs:
  - "[code://packages/server/src/commands/configure.ts#L309-L321](../../packages/server/src/commands/configure.ts#L309-L321) - `askToServe`, which adds a folder to `paths` only after a question"
  - "[code://packages/server/src/commands/options.ts#L991](../../packages/server/src/commands/options.ts#L991) - `--path`, which serves a folder for one run only"
  - "[code://packages/server/src/commands/paths.ts](../../packages/server/src/commands/paths.ts) - the three verbs"
---

## Context

A client such as ahp-desk sets the folder of a new host in its Add host step, before or after the daemon starts.
`--path` serves a folder for one run and writes nothing.
`paths remove` had `effect: 'remove'`, so cofold asked "Continue?" at a terminal and needed `--yes` without one.
On Windows the question read "paths remove removes folder <path>", which says the folder leaves the disk.
The question also came before the check, so a folder not in `paths` was asked about before it was refused.

## Decision

`ahpd paths list` shows the served folders, `ahpd paths add <folder>` adds one, and `ahpd paths remove <folder>` stops serving one.
No verb asks, at a terminal or over HTTP: `remove` takes a folder out of a list and deletes nothing, so its effect is `change`.
Each verb takes `--json`, and is declared in the command registry, so the daemon also serves it over HTTP.

Source: Softov, 2026-10-14, asked what shape the command takes: "ahpd paths list/add/remove".
Asked how to fix the remove question's words and its order after the Windows run: "ahpd: paths remove is not a remove".

## Consequences

A client sets a host's folders with one command, with no terminal and no `--yes`.
The question at `ahpd start` and in `ahpd configure` stays for a person at a terminal.

## Options

- **A confirmation text and a check in cofold**: an action gives its own question and a check that runs before it. This needs a cofold release, and keeps the question on `remove`.
- **`ahpd paths add` only**: the Add host step needs only this verb. A person then removes a folder by an edit of `config.json`.
