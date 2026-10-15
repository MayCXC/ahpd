---
title: The docs show one load with a built-in and a variant
status: done
depends: [task-01-each-preset-registers-its-own-agent.md, task-02-a-plugin-is-loaded-once.md]
layer: "docs"
refs:
  - "[code://packages/agent-claude/README.md](../../../../packages/agent-claude/README.md) - presets as a session choice, and the second load for OpenRouter"
  - "[code://docs/server/REFERENCE.md](../../../../docs/server/REFERENCE.md) - the plugin examples"
---

## Objective

The README and DAEMON.md describe presets as variants: the built-in `claude`, `false` to drop it, and a `claude-openrouter` preset named "Claude OpenRouter" with its own `models` and `env`.

## Files

- `UPDATE: packages/agent-claude/README.md` - the options table and the preset and OpenRouter sections.
- `UPDATE: docs/server/REFERENCE.md` - any example that loads a plugin twice.

## Steps

1. Replace the second-load example with one entry holding both presets.
2. Remove the session `preset` choice from the text, and the top-level `provider`, `displayName`, `models`, `keepCliModels` rows.

## Validation

- `rg -n "keepCliModels|displayName|preset" packages/agent-claude/README.md docs/server/REFERENCE.md` shows only the new shape.

## Resume
