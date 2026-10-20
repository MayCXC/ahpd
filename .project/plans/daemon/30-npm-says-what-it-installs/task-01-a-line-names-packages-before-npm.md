---
title: A line names the packages before npm runs
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/install.ts#L589-L606](../../../../packages/server/src/install.ts#L589-L606) - the install call"
  - "[code://packages/server/test/plugin-install.test.ts#L107](../../../../packages/server/test/plugin-install.test.ts#L107) - the `say` the tests read"
---

## Objective

Each npm call in `install.ts` follows a line that names its packages, so the terminal is not silent while npm works.

## Files

- `UPDATE: packages/server/src/install.ts:589-790` - say a line before each of the four npm calls.
- `UPDATE: packages/server/test/plugin-install.test.ts` - the cases in Validation.

## Steps

1. Write the tests first.
2. Say `Installing <names> with npm.` before the npm call in `installPlugins`.
3. Say `Updating <names> with npm.` before the npm call in `plugin update`.
4. With `--force`, say `Updating <name> with npm.` before each package's own npm call.
5. Say `Removing <names> with npm.` before the npm call in `plugin uninstall`.
6. Run the gates, and restore `packages/sdk/test/fixtures/wire.jsonl` after the tests.
7. Set the task to `implemented`, and write the Resume section.

## Validation

- A test: install says the `Installing` line, with every package named, before it calls the runner.
- A test: update says the `Updating` line before it calls the runner.
- A test: update with `--force` says one `Updating` line before each runner call.
- A test: uninstall says the `Removing` line before it calls the runner.
- Run `pnpm -s build`, `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk and server.

## Resume

Done 2026-10-16. Every step is built, and every case the Validation names passes. Not reviewed.

`install.ts` says one line before each of its four npm calls:

- `installPlugins`: `Installing <names> with npm.`
- `updatePlugins`: `Updating <names> with npm.`, and with `--force` one `Updating <name> with npm.` before each package's own call.
- `removePlugins`: `Removing <names> with npm.`

The names are what npm is given: the install's `wanted`, the update's `targets` and the remove's `uninstalled`. So a chosen version shows, as in `Installing @ahpd/agent-claude@0.1.0 with npm.`, and the sdk that every call installs is not named. The `Installed` line after npm uses the same names.

In `packages/server/test/plugin-install.test.ts`, `heard` records the lines said at each runner call, and four new cases check the line before npm for install, update, update with `--force` and uninstall. Nine cases that check the full list of said lines now hold the `Updating` line.

Validation: build, typecheck, boundary, `node tools/schema.mjs` and `git diff --quiet tools/` pass. Vitest on sdk, server, agent-claude, agent-acp, agent-cofold and bot: 273 files and 4909 tests pass. `packages/sdk/test/fixtures/wire.jsonl` is restored.

Left: the by-hand check of `ahpd configure` on Windows.
