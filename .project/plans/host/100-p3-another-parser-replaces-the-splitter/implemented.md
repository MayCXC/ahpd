---
title: Another parser replaces the splitter - implemented
date: 2026-10-19
refs:
  - git://a65f3b72
  - "[code://packages/sdk/src/types/host.ts](../../../../packages/sdk/src/types/host.ts)"
  - "[code://packages/sdk/src/types/plugin.ts](../../../../packages/sdk/src/types/plugin.ts)"
  - "[code://packages/sdk/src/plugins.ts](../../../../packages/sdk/src/plugins.ts)"
  - "[code://packages/sdk/src/validate.ts](../../../../packages/sdk/src/validate.ts)"
  - "[code://packages/sdk/src/host/spawn.ts](../../../../packages/sdk/src/host/spawn.ts)"
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts)"
---

The command parser is now a port, `commandParser`, and the sdk's `splitCommand` is its default.
A plugin replaces it with `registerCommandParser(split, when?)`.
An operator replaces it with the `commandParser` key, a module path relative to the configuration file.
A parser that throws or gives a wrong shape counts as `undefined`, so the call asks.

## What was built

- [`code://packages/sdk/src/types/host.ts`](../../../../packages/sdk/src/types/host.ts) - `HostOptions.commandParser`.
- [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts) - `commandParser` in `PortKey`, and `registerCommandParser` on `PluginHost`.
- [`code://packages/sdk/src/plugins.ts`](../../../../packages/sdk/src/plugins.ts) - `registerCommandParser` calls `setPort`, and `PORT_KEYS` has the port.
- [`code://packages/sdk/src/validate.ts`](../../../../packages/sdk/src/validate.ts) - `PORT_METHOD`, `PORT_MEMBERS` and the new `PORT_ITSELF`, which checks a port that is a function.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - `getAutoApproval` reads every line through the port, with a shape check.
- [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts) - `Config.commandParser`, resolved against the file that set it.
- [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts) - the `serverFields` entry, and `commandParser` in `FILE_ONLY`.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - `commandParserFrom` imports the module, and `parserConflict` refuses a plugin that sets the port without `'replace'`.

## Verified

- `packages/sdk/test/commandparser.test.ts`: 8 cases, for the option, a throw, a wrong shape, a plugin's parser, a non-function, a second registration and two plugins.
- `packages/server/test/commandparser.test.ts`: 10 cases, with the fixtures `parser`, `parser-none`, `plugin-parser` and `plugin-parser-replace`.
- The sdk suite had 3236 passed and 2 skipped, and the server suite had 1246 passed.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` passed.
- Softov reviewed the plan on 2026-10-19 and approved the close.

## Departures from the plan

- Task 01 - `PORT_KEYS`, `PORT_METHOD`, `PORT_MEMBERS` and `PORT_ITSELF` changed too, because the exhaustiveness checks need them for a new `PortKey`.
- Task 01 - the parser type is synchronous, because `Start.getAutoApproval` is synchronous.
- Task 03 - the key needed `packages/server/src/commands/options.ts`, which the Files list did not name.
- Task 03 - `parserConflict` is exported from `run.ts`, so its rule has a test without a daemon.

## Left for later

- A tree-sitter parser as a plugin, which the plan put outside its scope.
