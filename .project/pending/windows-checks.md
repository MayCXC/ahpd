---
title: Check daemon/30 on Windows
plans:
  - plans/daemon/30-npm-says-what-it-installs/plan.md
---

# Check daemon/30 on Windows

daemon/30 is built, and its tests pass. This run checks the lines in a real terminal on Windows, with `@ahpd/server` at the release that holds daemon/30.

## A line comes before npm

1. Run `ahpd configure`, and choose one agent plugin to install.
2. Check that `Installing <names> with npm.` shows before npm's own output.
3. Run `ahpd plugin update all`.
4. Check that `Updating <names> with npm.` shows before npm runs.
5. Run `ahpd plugin uninstall` on one plugin.
6. Check that `Removing <names> with npm.` shows before npm runs.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.
