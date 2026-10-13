---
title: A bot file edited by hand to a new owner takes it after a restart
status: open
date: 2026-10-13
severity: major
refs:
  - "[code://packages/bot/src/store.ts#L185-L198](../../packages/bot/src/store.ts#L185-L198) - `load`, which takes each file through `kept` and has no earlier owner to compare"
  - "[code://packages/server/src/plugins.ts#L897](../../packages/server/src/plugins.ts#L897) - `problem`, which keeps a plugin's line and reads it only when `apply` returns"
  - "[code://packages/bot/src/provider.ts#L436-L438](../../packages/bot/src/provider.ts#L436-L438) - the etag is `updatedAt`, which a hand edit does not change"
---

## Symptom

A person changes `owner` in `<configDir>/bots/<slug>.md` while the daemon runs.
The daemon keeps the old owner, but the daemon log shows no line.
After a restart, the bot has the owner from the file.
Found while checking plugin/45 p2 on a second daemon, 2026-10-13.

## Cause

- The refusal reaches `problem` in `plugins.ts`, which adds the line to `told`. `told` is read only when `apply` returns, so a later line is never logged.
- `load` reads each file on its own. The owner it compares with is in memory only, so a restart has nothing to compare.
- A hand edit keeps `updatedAt`, so a client's etag does not see the change.

## Impact

Anybody who can write the config folder can give a bot to another person, with a restart.
The refusal that the plan promised is not seen by the person who made the edit.

## Workaround

none.

## Fix

- Log a plugin's `problem` line at once, after `apply` too.
- For the restart, keep the true owner where a file edit does not reach, such as the host's records.
- Or accept the file as the truth after a restart, and log the change. Softov chooses between the two.
- Set `updatedAt` from the file's change time when a hand edit is taken.
