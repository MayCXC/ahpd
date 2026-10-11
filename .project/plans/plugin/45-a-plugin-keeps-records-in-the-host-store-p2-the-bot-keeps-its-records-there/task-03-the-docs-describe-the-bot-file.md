---
title: The docs describe the bot file
status: todo
depends: [task-02-a-hand-edit-reaches-the-provider.md]
layer: "docs"
refs:
  - "[code://docs/BOTS.md](../../../../docs/BOTS.md) - the bot guide"
  - "[code://packages/bot/README.md](../../../../packages/bot/README.md) - the package page"
---

## Objective

`docs/BOTS.md` shows a bot file, and says that an edit applies while the daemon runs.

## Files

- `UPDATE: docs/BOTS.md` - the file, the conversion from `.json`, and the rules for a hand edit.
- `UPDATE: packages/bot/README.md` - the bot is kept in the record store.

## Steps

1. Show one bot file with its frontmatter and its instructions.
2. Say that a `.json` record converts at start.
3. List what a hand edit may not change.
4. Say that a sqlite or postgresql plugin can keep the bots in place of the files.

## Validation

- `rg -n "\.json" docs/BOTS.md packages/bot/README.md` finds only the conversion.
- The sample file reads as a bot through `readRecordFile`.

## Resume
