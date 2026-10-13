---
title: The session tools switch in config.json is ignored
status: open
date: 2026-10-13
severity: major
blocks:
  - plans/host/33-a-session-tool-acts-as-the-person-it-works-for/task-03-the-session-tools-can-be-switched-off.md
refs:
  - "[code://packages/server/src/commands/options.ts#L477-L491](../../packages/server/src/commands/options.ts#L477-L491) - `sessionTools` and `sessionToolsProviders`, each with a `default`"
  - "[code://packages/server/src/commands/options.ts#L924](../../packages/server/src/commands/options.ts#L924) - `given`, which takes the flag before the file"
  - "[code://packages/server/src/commands/options.ts#L1051-L1053](../../packages/server/src/commands/options.ts#L1051-L1053) - the fallbacks, which already give the same defaults"
  - git://b5b793d5 - host/33 task 03
---

## Symptom

`"sessionTools": false` in `config.json` offers the session tools to every session all the same.
`"sessionToolsProviders": ["echo"]` in the file also offers them to every provider.
`ahpd config` shows the values from the file, but the startup lines do not say `session tools: offered to no session`.
The flags `--no-session-tools` and `--session-tools-providers` work.

## Cause

Both fields have a `default` in the flag schema, so the parser fills the flag value when no flag is given.
`given` then takes that value and never reads the file.
`advancedTools` has no `default` and reads the file correctly.

## Impact

A person cannot switch the session tools off in the config file or in a settings screen that writes it.

## Workaround

Use the flags.

## Fix

- Remove the two `default` values from the schema, because the fallbacks at `options.ts:1051-1053` give them.
- Add a test that a file value with no flag reaches the options.
