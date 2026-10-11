---
title: The docs describe the bot file
status: todo
depends: [task-03-the-store-reloads-an-edit.md]
layer: "docs"
refs:
  - "[code://docs/BOTS.md](../../../../docs/BOTS.md) - the bot scheme, and the folder section"
  - "[code://packages/bot/README.md](../../../../packages/bot/README.md) - the package README"
---

## Objective

A person knows where a bot file is, what it holds, and that the daemon uses an edit at once.

## Files

- `UPDATE: docs/BOTS.md` - a section on the file, with an example.
- `UPDATE: packages/bot/README.md` - one line on the file.

## Steps

1. Write that a bot is `<configDir>/bots/<slug>.md`, and that its workspace is `<root>/<slug>`.
2. Show an example file, with frontmatter and `instructions` as the body.
3. Write that a copy of the file under a new name installs a new bot.
4. Write which hand edits the daemon refuses, and what it keeps then.
5. Add one line on the file to the README.

## Validation

- `rg -n "<slug>.md" docs/BOTS.md packages/bot/README.md` finds the new lines.

## Resume
