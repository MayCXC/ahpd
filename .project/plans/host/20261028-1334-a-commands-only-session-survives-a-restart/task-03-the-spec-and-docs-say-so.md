---
title: The spec and docs say so
status: todo
depends: [task-01-the-catalogue-lists-it.md, task-02-it-opens-with-its-kept-turns.md]
layer: docs
refs:
  - "[code://.project/specs/sessions-and-chats.md#L225-L233](../../../../.project/specs/sessions-and-chats.md#L225-L233) - the pruning scenario"
---

## Objective

The spec and the docs say that a session whose turns the host keeps is listed after a restart and is not pruned.

## Files

- `UPDATE: .project/specs/sessions-and-chats.md:225-233` - the pruning scenario names the sessions it keeps.
- `UPDATE: docs/sdk/SESSIONS.md` - the catalogue lists a session whose only turns are the host's own.
- `CREATE: .project/plans/host/20261028-1334-a-commands-only-session-survives-a-restart/implemented.md` - the record of what was built.

## Steps

1. Add the kept-turns case to the pruning scenario, and keep its rule.
2. Say in the sessions page where such a row comes from.
3. Write `implemented.md`, and set the tasks and the plan to `done` and `built`.

## Validation

- `node .agents/skills/do-spec/scripts/lint-prose.mjs .project/plans/host/20261028-1334-a-commands-only-session-survives-a-restart .project/specs/sessions-and-chats.md` passes.

## Resume
