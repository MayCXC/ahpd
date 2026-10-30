---
title: The docs say a record agent runs in a machine
status: done
depends: [task-02-the-record-reaches-the-host-inside.md]
layer: "docs"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the nested host"
---

## Objective

The computer docs say that a record agent runs in a machine, and that its record goes in with its keys by name.

## Files

- `UPDATE: docs/plugins/COMPUTERS.md` - a paragraph on the record and `AHPD_AGENT_RECORD`.

## Steps

1. Write that the host inside serves the record of the session's agent.
2. Write that the record's keys go in by name, and that an ssh box gets none.

## Validation

- `node ~/.claude/skills/do-spec/scripts/lint-prose.mjs` passes on the plan folder.

## Resume

- Done.
