---
title: The docs describe the bot watch
status: todo
depends: [task-02-the-bot-provider-reports-changes.md]
layer: "docs"
refs:
  - "[code://docs/BOTS.md](../../../../docs/BOTS.md) - the bot scheme"
  - "[code://docs/RESOURCES.md](../../../../docs/RESOURCES.md) - `createResourceWatch` and the scheme grants"
---

## Objective

A client author reads how to watch bots, and which grant a watch needs.

## Files

- `UPDATE: docs/BOTS.md` - the commands table has `createResourceWatch`, and a section says what a watcher hears.
- `UPDATE: docs/RESOURCES.md` - a watch on a provider scheme needs `<scheme>:watch`, and `authorize` can let it through.
- `UPDATE: packages/bot/README.md` - one line on the watch.

## Steps

1. Add `createResourceWatch bot://` and `bot://<slug>` to the commands table in `docs/BOTS.md`.
2. Write which change type a make, an edit and a delete give.
3. Write that a watcher hears only bots it may read.
4. Write in `docs/RESOURCES.md` which grant a watch on a provider scheme needs.
5. Add one line on the watch to `packages/bot/README.md`.

## Validation

- `rg -n "createResourceWatch" docs/BOTS.md docs/RESOURCES.md` finds the new lines.

## Resume
