---
title: The docs describe a plugin channel and the catalogue
status: todo
depends: [task-04-the-host-advertises-a-plugin-channel.md, task-05-the-bot-plugin-serves-its-catalogue.md]
layer: "docs"
refs:
  - "[code://.project/plans/plugin/00-plugin.md#L47](../../../../.project/plans/plugin/00-plugin.md#L47) - the `registerMethod` row, which held channels too"
---

## Objective

`docs/PLUGINS.md` describes `registerChannel` and `users_changed`.
`docs/BOTS.md` describes the catalogue and its three actions.

## Files

- `UPDATE: docs/PLUGINS.md` - a section on `registerChannel`, `publish`, `subscribers`, `left` and `users_changed`.
- `UPDATE: docs/BOTS.md` - the catalogue, its snapshot and its actions.
- `UPDATE: packages/bot/README.md` - one line on the catalogue.
- `UPDATE: .project/plans/plugin/00-plugin.md:47` - a `channel` row, built, and the `registerMethod` row without the channel.

## Steps

1. Write the `registerChannel` section in `docs/PLUGINS.md`.
2. Add `users_changed` to the event list in `docs/PLUGINS.md`.
3. Write the catalogue section in `docs/BOTS.md`.
4. Add the line to `packages/bot/README.md`.
5. Add the `channel` row to `00-plugin.md`, and remove the channel from the `registerMethod` row.

## Validation

1. Run `rg -n "x-ahpd-bots" docs packages/bot/README.md` and find each new section.
2. Run `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs .project/plans/plugin/00-plugin.md`.
