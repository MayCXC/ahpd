---
title: A `paths` change served by the daemon also changes the folders it serves now
status: accepted
date: 2026-10-14
refs:
  - "[code://packages/server/src/commands/configure.ts#L319](../../packages/server/src/commands/configure.ts#L319) - `askToServe` adds a folder to the running list with one push"
  - "[code://packages/server/src/commands/run.ts#L408](../../packages/server/src/commands/run.ts#L408) - `running().paths`, which `ahpd status` shows"
  - "[code://packages/server/src/plugins.ts#L895](../../packages/server/src/plugins.ts#L895) - the frozen copy of `paths` a plugin gets when it loads"
  - "[code://packages/server/src/commands/plugin.ts#L166-L172](../../packages/server/src/commands/plugin.ts#L166-L172) - a plugin change at the terminal says a restart loads it"
---

## Context

The running daemon reads `paths` in three places.
The host's default folder is `paths[0]`, set at start.
`ahpd status` shows the list.
Each plugin gets a frozen copy when it loads.
No session is refused for a folder outside `paths`.

## Decision

`paths add` and `paths remove`, served by the daemon, write the daemon's own `config.json` and change its list at once.
`ahpd status` then shows the new list without a restart.
The default folder and the plugins' copies change only at the next start.

At the terminal, the verbs write `config.json` only.
With a daemon recorded, they say that a restart applies the change, or that `ahpd --remote <url> paths ...` applies it now.
This is the shape the plugin commands have.

Source: Softov, 2026-10-14, asked whether a running daemon takes the change: "Yes, live through a route".
The terminal half is defaulted: it copies `plugin install`, and `--remote` is already the way a terminal reaches a daemon.

## Consequences

A client that holds the daemon's token changes the folders with one request.
A plugin that reads `paths` sees a change only after a restart.

## Options

- **File only**: every change waits for a restart, so a new host shows its folder only after it starts again.
- **The terminal forwards to a recorded daemon by itself**: this needs the daemon's token at the terminal, which `--remote` already asks for.
