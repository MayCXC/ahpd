---
title: The docs name the rule
status: todo
depends: [task-02-claude-asks-for-a-matched-tool.md, task-03-acp-asks-for-a-matched-tool.md, task-04-pi-asks-for-a-matched-tool.md, task-05-cofold-asks-for-a-matched-tool.md]
layer: docs
refs:
  - "[code://docs/sdk/AHP.md#L195](../../../../docs/sdk/AHP.md#L195) - the keys the host acts on"
---

## Objective

The docs say what the rule does, who sets it, and where an ACP agent is out of its reach.

## Files

- `UPDATE: docs/sdk/AHP.md:195` - add `eligibleForAutoApproval` to the keys the host acts on.

## Steps

1. Add `eligibleForAutoApproval` to the list in `AHP.md`, and say that it needs `config:change`.
2. Say that a matched call asks in every backend and every mode, and offers no "always" option.
3. Say that an ACP agent's own tools are out of reach.
4. Set this task and the plan row to `implemented`.

## Validation

- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs docs/sdk` prints nothing new.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** keep each file's own style.
