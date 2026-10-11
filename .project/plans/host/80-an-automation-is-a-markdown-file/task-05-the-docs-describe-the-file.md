---
title: The docs describe the automation file
status: todo
depends: [task-04-the-store-reloads-an-edit.md]
layer: "docs"
refs:
  - "[code://docs/AUTOMATIONS.md#L191](../../../../docs/AUTOMATIONS.md#L191) - the `automations` option, which names `automations.json`"
  - "[code://docs/DAEMON.md#L318](../../../../docs/DAEMON.md#L318) - the same option"
---

## Objective

A person knows where an automation file is, what it holds, and that the daemon uses an edit at once.

## Files

- `UPDATE: docs/AUTOMATIONS.md` - a section on the file, with an example, and the option row.
- `UPDATE: docs/DAEMON.md` - the option names the folder.

## Steps

1. Write that an automation is `<configDir>/automations/<id>.md`, and what the state file holds.
2. Show an example file, with frontmatter and the message as the body.
3. Write that a copy of the file under a new name installs a new automation.
4. Change the option rows in `AUTOMATIONS.md` and `DAEMON.md` to name the folder.

## Validation

- `rg -n "automations.json" docs` finds only the line about the conversion.

## Resume
