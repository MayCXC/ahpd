---
title: The docs say how to update
status: todo
depends:
  - task-03-update-installs-moves-plugins-and-restarts.md
  - task-04-ahp-calls-the-update.md
  - task-05-windows-installs-after-the-daemon-stops.md
layer: docs
refs:
  - "[code://docs/server/UPGRADE.md](../../../../docs/server/UPGRADE.md) - the upgrade by hand"
---

## Objective

`docs/server/UPGRADE.md` starts at `ahpd update`, and keeps the three commands for an install that the update refuses.

## Files

- `UPDATE: docs/server/UPGRADE.md` - `ahpd update` first, then `--check`, `--version`, `--force`, and what is refused.
- `UPDATE: docs/server/RUN.md` - one line that points to the update.

## Steps

1. Put `ahpd update` at the top of `UPGRADE.md`.
2. Write what `--check`, `--version` and `--force` do.
3. List the refusals: a checkout, a link, a daemon in the foreground, a running turn and an unfit plugin.
4. Keep the three commands by hand for a refused install.
5. Say that over HTTP and AHP only the deployment token updates.
6. Run `lint-prose.mjs` on the changed files.
7. Set this task and the plan row to `implemented`.

## Validation

- The docs build passes.
- `lint-prose.mjs` prints nothing for the changed files.

## Resume
