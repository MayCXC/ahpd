---
title: The docs say how a client adds a rule
status: todo
depends: [task-02-a-client-rule-joins-the-instructions.md]
layer: docs
refs:
  - "[code://docs/sdk/TOOLS.md#L104-L114](../../../../docs/sdk/TOOLS.md#L104-L114) - \"The wording a session is given\""
---

## Objective

`TOOLS.md` says which client rules reach the system prompt, when, and which backends take them.

## Files

- `UPDATE: docs/sdk/TOOLS.md:104-114` - a paragraph on client rules.

## Steps

1. Add a paragraph on client rules to the section on session wording.
2. Say that only `alwaysApply: true` rules apply, and that a change reaches the next start.
3. Give the length limit, and say that the host drops a rule over it.
4. Name the backends that take instructions, and say that ACP logs once and ignores them.
5. Set this task and the plan row to `implemented`.

## Validation

- The paragraph matches the behaviour of task 02.
- `pnpm -s docs:build` passes.

## Resume
