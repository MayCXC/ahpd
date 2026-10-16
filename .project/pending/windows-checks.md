---
title: Check daemon/23 and daemon/30 on Windows
plans:
  - plans/daemon/23-npm-installs-a-plugin-on-windows/plan.md
  - plans/daemon/30-npm-says-what-it-installs/plan.md
---

# Check daemon/23 and daemon/30 on Windows

daemon/23 and daemon/30 are built, and their tests pass. This run checks the npm lines and a plugin removal in a real terminal on Windows, with `@ahpd/server` at the release that holds daemon/30.

## A line comes before npm

1. Run `ahpd configure`, and choose one agent plugin to install.
2. Check that `Installing <names> with npm.` shows before npm's own output.
3. Run `ahpd plugin update all`.
4. Check that `Updating <names> with npm.` shows before npm runs.
5. Run `ahpd plugin remove` on one plugin.
6. Check that `Removing <names> with npm.` shows before npm runs.
7. A pass of steps 5 and 6 also ticks the remove line of daemon/23.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.

## Results on Windows, 2026-10-16

Run by Softov on Windows 10 with Node 24.12.0, from a build of ahpd `main` at `299481a8`.
The published `@ahpd/server` 0.12.0 does not hold daemon/30, so the check ran from the build.

- **A line comes before npm:** pass.
  - `ahpd configure` with Claude only printed `Installing @ahpd/agent-claude@0.12.0 with npm.` before npm's `added 7 packages`.
  - `ahpd plugin update all` printed `Updating @ahpd/agent-claude@0.12.0 with npm.` before npm's `up to date, audited 8 packages`, then `Nothing to update.`
  - `ahpd plugin remove @ahpd/agent-claude` printed `Removing @ahpd/agent-claude with npm.` before npm's `removed 4 packages`, and the plugin left the config.
  - Steps 5 and 6 tick the remove line of daemon/23.
