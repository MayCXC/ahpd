---
title: A line names the packages before npm runs
status: todo
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
