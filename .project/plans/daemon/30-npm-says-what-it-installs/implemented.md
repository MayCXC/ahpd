---
title: npm says what it installs before it runs - implemented
date: 2026-10-19
refs:
  - git://3194fc97
  - "[code://packages/server/src/install.ts#L635](../../../../packages/server/src/install.ts#L635) - the `Installing` line"
  - "[code://packages/server/src/install.ts#L758-L767](../../../../packages/server/src/install.ts#L758-L767) - the `Updating` lines"
  - "[code://packages/server/src/install.ts#L826](../../../../packages/server/src/install.ts#L826) - the `Removing` line"
---

`ahpd configure` and the plugin commands print a line that names the packages before npm runs.
The terminal is no longer silent while npm works.

## What was built

- [`code://packages/server/src/install.ts`](../../../../packages/server/src/install.ts) - one line before each of the four npm calls: `Installing <names> with npm.`, `Updating <names> with npm.` and `Removing <names> with npm.`. With `--force`, each package gets its own `Updating` line before its own npm call.
- [`code://packages/server/test/plugin-install.test.ts`](../../../../packages/server/test/plugin-install.test.ts) - `heard` records the lines said at each runner call.

## Verified

- `plugin-install.test.ts`: `says the Installing line, with every package named, before npm runs`, `says the Updating line before npm runs`, `says one Updating line before each npm call with --force` and `says the Removing line before npm runs` pass.
- Nine cases that check the full list of said lines hold the `Updating` line.
- On 2026-10-16, build, typecheck, boundary and schema passed, and vitest on sdk, server, agent-claude, agent-acp, agent-cofold and bot passed 4909 tests.
- By hand on Windows 10, 2026-10-16, from a build of `main` at `299481a8`: `ahpd configure`, `ahpd plugin update all` and `ahpd plugin remove` each printed their line before npm's output.

## Departures from the plan

- The names in a line are the names npm gets, so a chosen version shows, as in `Installing @ahpd/agent-claude@0.1.0 with npm.`. The sdk that every call installs is not named.

## Left for later

- none.
