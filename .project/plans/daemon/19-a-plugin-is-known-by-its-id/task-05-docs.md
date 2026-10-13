---
title: The docs say a plugin is known by its id
status: done
depends: [task-02-root-config-keys-each-plugin-by-its-id.md, task-03-the-plugin-verbs-take-the-id.md, task-04-plugin-option-names-the-id.md]
layer: "docs"
refs:
  - "[code://docs/PLUGINS.md#L21-L62](../../../../docs/PLUGINS.md#L21-L62) - how a plugin is named"
---

## Objective

The docs name a plugin by its id in every example of a key, a verb and `--plugin-option`.
PLUGINS.md says what the id is and links the decision.

## Files

- `UPDATE: docs/PLUGINS.md:21-62` - say what the id is, and that a disabled plugin is imported to read it.
- `UPDATE: docs/DAEMON.md` - the examples of `--plugin-option`, the verbs and `plugins.<id>`.
- `UPDATE: docs/HOST.md:131` - the root config key.
- `UPDATE: docs/TOOLS.md:117-129` - the examples that name a plugin.
- `UPDATE: packages/server/README.md:140-154` - the flag rows.

## Steps

1. Search the docs for `plugins.`, `--plugin-option` and `ahpd plugin`.
2. Change each example that names a plugin by its path to its id.
3. Add a paragraph to PLUGINS.md on the id, with a link to the decision.

## Validation

- `rg -n "plugins\.\./|--plugin-option \./" docs packages/server/README.md` finds nothing.
