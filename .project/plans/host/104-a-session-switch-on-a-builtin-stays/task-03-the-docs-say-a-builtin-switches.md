---
title: The docs say a built-in switches
status: done
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

Implemented 2026-10-16.

One row added to the toggling rows of the "Sessions and the catalogue" table in `docs/sdk/AHP.md`, between the skill and prompt row and the MCP server row: `toggling a plugin`, named after the same label style the rows around it use. It says `enabledPlugins` is what the switch goes through, that the read-back is what says it took, and that a session switch stays because the host keeps the decision by id - the CLI answers `reloadPlugins` with the plugins it is loading, and a plugin switched off is not one of them, so the CLI's own list cannot be where the row is drawn from.

The skill and prompt row is untouched, as the step asks: a skill, a prompt and a subagent are still refused out loud, and the plugin row above the MCP server row is the one that switches.

`pnpm -s docs:build` passes (vitepress 1.6.4, 15.8s). No package changed, so no vitest by path was run for this task; the plan's gates were run anyway and pass - `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` (11 packages, none undeclared), `node tools/schema.mjs` (508 definitions) and `git diff --quiet tools/` clean.

Nothing is committed: this preset allows neither `git add` nor `git commit`, so the row is left in the worktree to be reviewed and committed afterwards. The files this task changed:

- `UPDATE: docs/sdk/AHP.md` - the toggling-a-plugin row.
- `UPDATE: .project/plans/host/104-a-session-switch-on-a-builtin-stays/plan.md` - the Tasks table and the Resume state.

The plan's final checklist row `plans/index.md` updated is left unticked on purpose: this session is not to edit `plans/index.md`.
