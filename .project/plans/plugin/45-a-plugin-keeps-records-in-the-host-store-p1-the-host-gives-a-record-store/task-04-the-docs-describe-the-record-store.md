---
title: The docs describe the record store
status: todo
depends: [task-02-the-server-keeps-records-as-markdown.md, task-03-a-plugin-gets-yaml-from-the-host.md]
layer: "docs"
refs:
  - "[code://docs/PLUGINS.md](../../../../docs/PLUGINS.md) - the plugin guide, hard-wrapped"
  - "[code://.project/plans/plugin/00-plugin.md#L36-L47](../../00-plugin.md) - the table of registration kinds"
---

## Objective

`docs/PLUGINS.md` tells a plugin author how to keep records and read YAML, and the domain reference lists the `records` port.

## Files

- `UPDATE: docs/PLUGINS.md` - a section on `host.records`, `registerRecords` and the YAML functions, wrapped like the rest of the file.
- `UPDATE: .project/plans/plugin/00-plugin.md:40` - `registerRecords` in the port row.
- `UPDATE: docs/DAEMON.md` - the files under `<configDir>/<collection>/`.

## Steps

1. Add the section to `docs/PLUGINS.md`, with an example that opens a collection and puts one record.
2. Show the file that the example writes.
3. Add `registerRecords` and `records` to the port row of `00-plugin.md`.
4. Name the collection folders in `docs/DAEMON.md`.

## Validation

- `rg -n "registerRecords|host.records" docs .project/plans/plugin/00-plugin.md` finds each new line.
- Each code sample matches the types in `packages/sdk/src/types/records.ts`.

## Resume
