---
title: A config key loads a parser module
status: implemented
depends: [task-02-a-plugin-registers-a-command-parser.md]
layer: server
refs:
  - "[code://packages/server/src/config.ts#L318-L323](../../../../packages/server/src/config.ts#L318-L323) - `plugins`"
  - "[code://packages/server/src/plugins.ts#L566](../../../../packages/server/src/plugins.ts#L566) - the module import"
---

## Objective

The daemon key `commandParser` names a `.ts` or `.js` module.
The daemon imports it and sets its default export on the port.

## Files

- `UPDATE: packages/server/src/config.ts:318-323` - the `commandParser` key and its doc, beside `plugins`.
- `UPDATE: packages/server/src/commands/run.ts` - import the module and pass its `split` to the host.
- `UPDATE: packages/server/test` - a module that loads, one with no default export, and a missing file.

## Steps

1. Add the `commandParser` key, a path relative to the config file.
2. Import the module by file URL, as the plugin loader does.
3. Refuse the start when the default export is not a function.
4. Refuse the start when a plugin also sets the port without `replace`.
5. Pass the function to the host as `commandParser`.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The server tests pass.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** steps 1 to 6, 2026-10-19. `Config.commandParser` is a `string` in `packages/server/src/config.ts`, and `anchored` resolves it against the file that set it, so the daemon reads an absolute path. `Options.commandParser` and the `serverFields` entry are in `packages/server/src/commands/options.ts`. `commandParser` is in `FILE_ONLY`, so the key has no flag, and `optionsFrom` reads it from the file alone. The entry's description says the module's default export is `(line, shell) => ({ subCommands, writeDests, unanalyzable })` and that a `.ts` module needs Node 22.18 or newer, Bun, or Deno. `packages/server/src/commands/run.ts` has `commandParserFrom(file)`. It imports by file URL, as the plugin loader does. A file that does not import, or one whose default export is not a function, stops the start; otherwise it answers the function. The start stamps `start: parser` only when the file names one, then passes the function to the host as `commandParser`. `parserConflict(named, contributions)` stops the start when the file named a module and a plugin also set the port without `'replace'`. A plugin with `'replace'` takes the port over, and the fold's own rule still decides two plugins. `packages/server/test/commandparser.test.ts` is new, 10 cases, all passing, with four fixtures: `parser`, `parser-none`, `plugin-parser` and `plugin-parser-replace`. The server suite is 1246 passed.
- **Next action:** none: the plan's tasks are implemented, and the plan is left for review.
- **Open questions:** none.
- **Watch out for:** the loader calls `stop` rather than throwing a message of its own. A bad module reaches the person as an `ArgumentError` with exit code 1, the same as a refused configuration value. The `start: parser` line is written only when a module is named, so the stage list of a daemon that names none is unchanged.
- **Departed from the plan:** the key could not live in `config.ts` and `run.ts` alone. `Options`, `serverFields` and `FILE_ONLY` are in `packages/server/src/commands/options.ts`. Without the entry there, the key would be an unknown setting in `config.json` and `configSchema` would not have it. `parserConflict` is exported from `run.ts`, so its rule is tested without starting a daemon. The `plugin-parser` fixtures are new beside the three the task names.
