---
title: The copy gets a Claude manifest
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/plugins/clientplugins.ts#L153-L199](../../../../packages/sdk/src/plugins/clientplugins.ts#L153-L199) - `sync`"
  - "[code://packages/sdk/src/plugins/pluginparts.ts#L44-L52](../../../../packages/sdk/src/plugins/pluginparts.ts#L44-L52) - the two manifests"
---

## Objective

A copy that has `.plugin/plugin.json` and no `.claude-plugin/plugin.json` gets a Claude manifest before it is moved into place.
Its `name` is the Open Plugins name in kebab case, and its `description` is the same.

## Files

- `UPDATE: packages/sdk/src/plugins/clientplugins.ts:180-186` - after the copy and before the rename, write the Claude manifest.
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

- **Done so far:** built 2026-10-16. `claudeManifestIn` in `packages/sdk/src/plugins/clientplugins.ts` runs on the building directory, between the copy and the rename into place. A copy that brought `.plugin/plugin.json` and no `.claude-plugin/plugin.json` gets the second written from the first: its `name` in kebab case by `kebab`, which is lower case with a dash for each run of anything else, and the `description` it wrote carried over beside it. A copy that brought a Claude manifest is left exactly as it is, and one that brought no manifest gets none. Three tests in `packages/sdk/test/clientplugins.test.ts`: the bundle of `VS Code Synced Data` gets `vs-code-synced-data` with its description, a copy with its own `{"name":"mine"}` keeps it, and a copy with no manifest gets no `.claude-plugin` at all.
- **Next action:** build task 02.
- **Open questions:** none.
- **Watch out for:**
  - Step 1 was not run. It wants a Claude session against a provider, which this box has none of to spend, and the plan's live checks wait on Softov. What stands in for it is the CLI binary of `@anthropic-ai/claude-agent-sdk-linux-x64@0.3.301`: `claude-plugin/plugin.json` is in it 31 times and `.plugin/plugin.json` not at all, so the CLI reads the Claude manifest and no Open Plugins one. The other half of the gap, that a plugin with no manifest is named by its directory, is still read from the binary rather than from a run.
  - `packages/sdk/test/fixtures/wire.jsonl` is dirty from the sdk suite. Restore it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
  - Only `sync` writes the manifest. `capture`, the automation path, is untouched, as this task's Files name `sync` alone.
  - The manifest written holds `name` and `description` and nothing else. An Open Plugins manifest that moves a component, with `agents`, `skills`, `rules`, `hooks` or `mcpServers` of its own, would have that section read from nowhere once `pluginparts` finds the Claude manifest first and the Open Plugins one is no longer the format. The task decides the two fields and not the rest.
  - A `.plugin/plugin.json` with no `name`, or one whose `name` is not a string, gets no Claude manifest: there is nothing to name the plugin by. The task does not decide this case either, so the copy is left exactly as the client sent it.
