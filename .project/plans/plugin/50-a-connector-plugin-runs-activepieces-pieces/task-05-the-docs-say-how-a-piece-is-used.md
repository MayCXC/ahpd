---
title: The docs say how a piece is used
status: todo
depends:
  - task-04-resend-telegram-and-slack-are-the-first-pieces.md
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md#L500-L540](../../../../docs/plugins/PLUGINS.md#L500-L540) - \"An adapter of your own\""
  - "[code://docs/plugins/webhook.md](../../../../docs/plugins/webhook.md) - the page of a connector plugin, the pattern to copy"
---

## Objective

A docs page says how to name a piece, make a connector of it, and bind it to a session or a bot.

## Files

- `CREATE: docs/plugins/connector-activepieces.md` - the plugin page.
- `UPDATE: docs/plugins/PLUGINS.md` - a link to the page from the adapter section.
- `UPDATE: CHANGELOG.md` - the new plugin.

## Steps

1. Copy the layout of `docs/plugins/webhook.md`.
2. Show the `pieces` option with the three first pieces.
3. Show a Resend connector, and a session config with `connectors: { work: "connectors://ap-resend/<id>" }`.
4. List what is out of scope: OAuth, files, and triggers.
5. Add a changelog line.
6. Set each task and the plan row to `implemented`.

## Validation

- Each example in the page matches the code of tasks 01 to 04.

## Resume
