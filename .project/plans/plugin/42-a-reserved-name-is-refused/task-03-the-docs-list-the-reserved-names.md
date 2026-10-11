---
title: The docs list the reserved names
status: todo
depends: [task-02-a-harness-and-a-scheme-cannot-share-a-name.md]
layer: "docs"
refs:
  - "[code://docs/PLUGINS.md](../../../../docs/PLUGINS.md) - what a plugin may register"
  - "[code://.project/plans/plugin/00-plugin.md](../00-plugin.md) - the registration kinds"
---

## Objective

A plugin author reads which names are reserved, and why, before writing a plugin.

## Files

- `UPDATE: docs/PLUGINS.md` - a section on reserved names: the prefixes, the names, and the two clashes.
- `UPDATE: .project/plans/plugin/00-plugin.md` - the `registerAgent` and `registerResourceProvider` rows name the reserved check.

## Steps

1. Add a section "Reserved names" to `docs/PLUGINS.md` after the section on `registerResourceProvider`.
2. List the three prefixes and the reserved names, with one line on why for each group.
3. Say that a harness and a scheme cannot share a name.
4. Say that a refused registration drops the plugin's contribution with one problem line.
5. Add the reserved check to the two rows in `00-plugin.md`.

## Validation

- `rg -n "reservedScheme" docs packages` finds nothing.
- `node <do-spec>/scripts/lint-prose.mjs .project/plans/plugin/00-plugin.md` passes.

## Resume
