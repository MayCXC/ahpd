---
title: Review the bot record store
plans:
  - plans/plugin/45-p2-the-bot-keeps-its-records-there/plan.md
---

# Review the bot record store

I ran the three checks on a second daemon on 2026-10-13, over the protocol and not in ahpapp. Steps 1 and 3 pass. Step 2 fails in two ways.

## Results

1. **Pass over the protocol.** I changed a bot's description in its `.md` file. The next read gives the new text, with no restart. The bot's `updatedAt` does not change, so a client that compares it does not see the edit.
2. **Fail.** I changed `owner` in a bot file by hand. The daemon keeps the old owner, but the log shows no line. After a restart, the bot has the new owner. See [the problem](../problems/a-bot-file-edited-by-hand-to-a-new-owner-takes-it-after-a-restart.md).
3. **Pass.** A deleted bot's file goes, and a make with the same slug is refused with `-32010`.

## Your choice for step 2

After a restart, the store has only the file to read. To keep the owner, the true owner must be kept where a file edit does not reach, such as the host's records. The other way is to accept the file as the truth after a restart, and log the change. Tell me which you want.

## Check by hand

1. In ahpapp, open a bot, then change its description in the file. The screen shows the change without a restart.
2. In ahpapp, delete a bot. It goes from the list.

## Reply

- Write "pass" or what you saw for the two ahpapp checks.
- Say how the owner is kept after a restart.
