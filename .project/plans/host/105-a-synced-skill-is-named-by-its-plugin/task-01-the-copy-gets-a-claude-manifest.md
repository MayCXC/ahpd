---
title: The copy gets a Claude manifest
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/clientplugins.ts#L153-L199](../../../../packages/sdk/src/clientplugins.ts#L153-L199) - `sync`"
  - "[code://packages/sdk/src/pluginparts.ts#L44-L52](../../../../packages/sdk/src/pluginparts.ts#L44-L52) - the two manifests"
---

## Objective

A copy that has `.plugin/plugin.json` and no `.claude-plugin/plugin.json` gets a Claude manifest before it is moved into place.
Its `name` is the Open Plugins name in kebab case, and its `description` is the same.

## Files

- `UPDATE: packages/sdk/src/clientplugins.ts:180-186` - after the copy and before the rename, write the Claude manifest.
- `UPDATE: packages/sdk/test` - the test of the client plugin copy holds the two cases.

## Steps

1. Start a Claude session with a copy that has only `.plugin/plugin.json`, and record the plugin name in Resume.
2. Read `.plugin/plugin.json` in the building directory, after the copy.
3. Stop when `.claude-plugin/plugin.json` is there.
4. Turn the name into kebab case: lower case, and a dash for each run of other characters.
5. Write `.claude-plugin/plugin.json` with that name and the description.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- A test: a copy of `{ name: 'VS Code Synced Data' }` holds `.claude-plugin/plugin.json` with `name: 'vs-code-synced-data'`.
- A test: a copy with its own Claude manifest keeps that file unchanged.
- A test: a copy with no manifest gets none.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
