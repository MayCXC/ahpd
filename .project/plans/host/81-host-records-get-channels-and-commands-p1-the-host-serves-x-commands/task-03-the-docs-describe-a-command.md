---
title: The docs describe a command of your own
status: done
depends: [task-02-the-host-answers-a-served-method.md]
layer: "docs"
refs:
  - "[code://docs/PLUGINS.md](../../../../docs/PLUGINS.md) - \"A channel of your own\", the section this one follows"
  - "[code://.project/plans/plugin/00-plugin.md#L48](../../../../.project/plans/plugin/00-plugin.md#L48) - the `registerMethod` row"
---

## Objective

`PLUGINS.md` says how a plugin serves a command, and the domain reference marks `registerMethod` as built.

## Files

- `UPDATE: docs/PLUGINS.md` - a section "A command of your own", after "A channel of your own".
- `UPDATE: .project/plans/plugin/00-plugin.md:48` - the `registerMethod` row, built, with a link to this plan.

## Steps

1. Write the section in the file's own style, hard-wrapped as the file is.
2. Show `registerMethod` with a grant, an `authorize` and a `handle`.
3. Say that the name starts with `x-`, and that this host names its own `x-ahpd/<domain>/<verb>`.
4. Say that `_meta['ahpd.methods']` lists the command.
5. Set the `registerMethod` row to built, with the date and a link to this plan.

## Validation

- The example in the section matches the types in `types/plugin.ts`.
- The `00-plugin.md` row links to this plan.

## Resume

Implemented 2026-10-11. `PLUGINS.md` has the section, a `registerMethod` row in "What you can register", and no longer lists host methods as not built. `00-plugin.md` row 48 is built and links to this plan, and its known gaps no longer list host methods.
