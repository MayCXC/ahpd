---
title: The docs say a built-in switches
status: todo
depends: [task-02-the-host-keeps-a-session-decision.md]
layer: docs
refs:
  - "[code://docs/sdk/AHP.md#L678](../../../../docs/sdk/AHP.md#L678) - the toggle row"
---

## Objective

`docs/sdk/AHP.md` says that a Claude plugin switches for one session or for all, and that a skill or prompt is still refused.

## Files

- `UPDATE: docs/sdk/AHP.md:678` - a row for toggling a plugin, beside the row for a skill or prompt.

## Steps

1. Add a row for toggling a plugin: through the CLI's `enabledPlugins`, then read back.
2. Keep the skill and prompt row as it is.
3. Run `pnpm -s docs:build`.
4. Set this task and the plan row to `implemented`.

## Validation

- The row names `enabledPlugins` and says that a session switch stays.
- `pnpm -s docs:build` passes.

## Resume
