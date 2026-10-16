---
title: The docs describe the record store
status: done
depends: [task-02-the-server-keeps-records-as-markdown.md, task-03-a-plugin-gets-yaml-from-the-host.md]
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - the plugin guide, hard-wrapped"
  - "[code://.project/plans/plugin/00-plugin.md#L36-L47](../../00-plugin.md) - the table of registration kinds"
---

## Objective

`docs/plugins/PLUGINS.md` tells a plugin author how to keep records and read YAML, and the domain reference lists the `records` port.

## Files

- `UPDATE: docs/plugins/PLUGINS.md` - a section on `host.records`, `registerRecords` and the YAML functions, wrapped like the rest of the file.
- `UPDATE: .project/plans/plugin/00-plugin.md:40` - `registerRecords` in the port row.
- `UPDATE: docs/server/REFERENCE.md` - the files under `<configDir>/<collection>/`.

## Steps

1. Add the section to `docs/plugins/PLUGINS.md`, with an example that opens a collection and puts one record.
2. Show the file that the example writes.
3. Add `registerRecords` and `records` to the port row of `00-plugin.md`.
4. Name the collection folders in `docs/server/REFERENCE.md`.

## Validation

- `rg -n "registerRecords|host.records" docs .project/plans/plugin/00-plugin.md` finds each new line.
- Each code sample matches the types in `packages/sdk/src/types/records.ts`.

## Resume

- **Done so far:** all steps. `docs/plugins/PLUGINS.md` has the sections "Keeping records" and "Reading and writing YAML", and `docs/server/REFERENCE.md` has "Plugin records".
- **Built as:** the new paragraphs in `docs/plugins/PLUGINS.md` are not hard-wrapped, the same as the sections near them.
- **Built as:** the two tables in `docs/plugins/PLUGINS.md` have rows for `registerRecords`, `parseYaml` and `stringifyYaml`.
