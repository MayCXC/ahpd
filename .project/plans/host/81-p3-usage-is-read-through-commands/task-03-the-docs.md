---
title: The docs describe the usage commands
status: done
depends: [task-02-the-usage-commands.md]
layer: "docs"
refs:
  - "[code://docs/sdk/USAGE.md](../../../../docs/sdk/USAGE.md) - the `usage:` scheme"
---

## Objective

`USAGE.md` names each command, its params and its answer, and says that the scheme stays.

## Files

- `UPDATE: docs/sdk/USAGE.md` - a section on the five commands.

## Steps

1. Add the section in the file's own style.
2. Give each command its params, its answer and the read it matches.
3. Say which reader needs `usage:read`.

## Validation

- Each example matches a test in task 02.

## Resume

Implemented 2026-10-11. `USAGE.md` has a section "Reading usage by command". The example matches `usage-methods.test.ts`.
