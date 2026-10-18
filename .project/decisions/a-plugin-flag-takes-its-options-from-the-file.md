---
title: A --plugin that names a plugin the file lists takes that entry's options and grants
status: accepted
date: 2026-10-18
refs:
  - "[code://packages/server/src/commands/options.ts#L984-L1015](../../packages/server/src/commands/options.ts#L984-L1015) - `filed`, where a typed `--plugin` takes the file entry's options and grants"
  - "[code://packages/computer/src/plugin.ts#L1492-L1504](../../packages/computer/src/plugin.ts#L1492-L1504) - `nestedHost`, which starts `<host> --stdio --plugin <each>` inside a machine"
---

## Context

A nested host is started inside a machine as `ahpd --stdio --plugin <each>`.
A command-line `--plugin` replaced the configuration file's whole plugin list, and each entry's `options` went with it.
On an ssh box the backends keep their settings in the box's own file: an ACP load's `presets`, cofold's `model`.
So the host inside loaded each backend bare, and agent-acp was skipped with "presets is required".
Found while checking container/05 p9 task 06 on a Debian box, 2026-10-18.

## Decision

The flag picks which plugins run, and the file still says how each is set up.
A `--plugin` naming a plugin the file lists takes that entry's `options` and `grants`.
The entry's `enabled` is not taken, because the person named the plugin for this run.
A `--plugin` the file does not list loads with no options, as before.

## Consequences

Every nested host loads its backends as its own file sets them up. That is true on an ssh box, a Docker machine with a configuration volume, or a joined node.
A person's one-run `--plugin` of a configured plugin keeps that plugin's options.
A run that wants a configured plugin bare now needs `--plugin-option` or another configuration file.

## Options

- The box's nested host started with no `--plugin`, so it loads the box's whole plugin list.
  It lost because it loads plugins the session does not use. Also, a missing plugin fails with a vaguer sentence than "this host has no such plugin".
  Softov, 2026-10-18, asked "Where should the fix go?": "Server keeps options".
