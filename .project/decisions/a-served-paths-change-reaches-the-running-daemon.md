---
title: A `paths` change served by the daemon also changes the folders it serves now
status: accepted
date: 2026-10-14
refs:
  - "[code://packages/server/src/commands/configure.ts#L319](../../packages/server/src/commands/configure.ts#L319) - `askToServe` adds a folder to the running list with one push"
  - "[code://packages/server/src/commands/run.ts#L408](../../packages/server/src/commands/run.ts#L408) - `running().paths`, which `ahpd status` shows"
  - "[code://packages/server/src/plugins.ts#L895](../../packages/server/src/plugins.ts#L895) - the frozen copy of `paths` a plugin gets when it loads"
  - "[code://packages/server/src/commands/plugin.ts#L166-L172](../../packages/server/src/commands/plugin.ts#L166-L172) - a plugin change at the terminal says a restart loads it"
  - "[code://packages/server/src/commands/paths.ts](../../packages/server/src/commands/paths.ts) - the verbs, and `restartLine`, the hint at the terminal"
  - "[code://packages/server/src/daemon.ts#L264-L285](../../packages/server/src/daemon.ts#L264-L285) - `recordOf`, the record the terminal reads"
---

## Context

A served `paths add` or `paths remove` changes the folders the daemon serves now.
At the terminal, the verbs wrote `config.json` only and printed `ahpd --remote <url> paths ...` as the way to apply the change now.
On Windows that line did not work.
The record holds the `ws://` origin, but `--remote` needs the HTTP address of the API and a token the person must find.
The record is an owner-only file, and it already holds the daemon's token in `connectUrl`.

## Decision

A served `paths add` or `paths remove` writes the daemon's own `config.json`, changes the list it serves, and rewrites `paths` in `daemon.json`.
At the terminal, with a daemon recorded that serves the HTTP API and with no `--config-file` given, the verb sends the change to that daemon.
It uses the API address and the token from the record, so the change applies at once.
Otherwise the verb writes `config.json` only and says that `ahpd restart` applies the change.

Source: Softov, 2026-10-14, asked what a plain `ahpd paths add` does while a daemon runs: "Forward to the daemon itself".

## Consequences

ahp-desk adds a folder with a plain `ahpd paths add`, with no token and no restart, when the daemon serves the API.
`ahpd status --json` shows the new list, because the record changes too.
A daemon without `http` still needs a restart.

## Options

- **Fix the hint only**: the terminal writes the file and prints a command that works, with the API address and `--token-file`. The person or the desk runs the second command.
