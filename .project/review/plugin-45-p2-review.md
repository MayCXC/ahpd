---
title: Review the bot record store
plans:
  - plans/plugin/45-a-plugin-keeps-records-in-the-host-store-p2-the-bot-keeps-its-records-there/plan.md
---

# Review the bot record store

Tasks 01 to 03 are merged in `6d951a8` and `cd1fbb9`, and released in 0.11.0. A bot is now `<configDir>/bots/<slug>.md`. Your five bots converted on 2026-10-11, and they show in the clients.

## Read

- `packages/bot/src/store.ts`: the cache, the tombstones in `bots-gone`, and the refusal of a hand edit that changes the owner or the workspace.
- [implemented.md](../plans/plugin/45-a-plugin-keeps-records-in-the-host-store-p2-the-bot-keeps-its-records-there/implemented.md): tasks 01 and 02 are one commit, and `bot-docs.test.ts` is a test no task named.

## Check by hand

1. Edit the description of a bot in its `.md` file. ahpapp shows the change without a restart.
2. Change `owner` in a bot file by hand. The daemon log reports a problem, and the bot keeps its owner.
3. Delete a bot in ahpapp. Its file goes, and a make with the same slug is refused with `-32010`.

## Reply

Write "approved", or the findings. Approval sets tasks 01 to 03 to `done`.
