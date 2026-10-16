---
title: A config key loads a parser module
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a `.ts` module needs a runtime that strips types; say which in the key's doc.
