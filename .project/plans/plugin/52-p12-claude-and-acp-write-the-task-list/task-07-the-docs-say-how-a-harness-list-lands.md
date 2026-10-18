---
title: The docs say how a harness list lands
status: todo
depends: [task-05-claudes-own-task-calls-write-the-plan.md, task-06-the-acp-plan-update-writes-the-plan.md]
layer: "docs"
refs:
  - "[code://docs/plugins/agent-claude.md](../../../../docs/plugins/agent-claude.md) - the Claude plugin's page"
  - "[code://docs/plugins/agent-acp.md](../../../../docs/plugins/agent-acp.md) - the ACP plugin's page"
---

## Objective

The docs say that Claude uses the host task tools by default, and how to keep its own tools.
They also say how a harness list becomes the session's plan.

## Files

- `UPDATE: docs/plugins/TASK-LIST.md` - the session's plan, the text match, a dropped step, and `source`.
- `UPDATE: packages/agent-claude/README.md` - the two settings and their defaults.
- `UPDATE: packages/agent-acp/README.md` - the plan update writes the session's plan.

## Steps

1. Say that a Claude session uses the host task tools by default.
2. Show the setting that keeps Claude's own tools, and the setting for `CLAUDE_CODE_ENABLE_TASKS`.
3. Say that a whole list matches by text, and that a missing step reads `dropped`.
4. Say that a `codex-acp` session fills the session's plan through the ACP plan update.

## Validation

- The docs match the code of tasks 02 to 06.

## Resume
