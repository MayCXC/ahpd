# Implemented - A secret field says secret

## What was built

A vault field now says `secret: true`. `isSecret(node)` in `packages/sdk/src/channels/owners.ts` answers true for `secret: true`, and true for `writeOnly: true` when the node says nothing about `secret`; a node that says `secret: false` beside `writeOnly: true` is not a vault field. `secretFields(schema)` and `secretPaths(schema, ...)` are built on it, and `writeOnlyPaths` is renamed to `secretPaths` in the export at `packages/sdk/src/index.ts:118`.

The connector channel, the agents channel and the migration read the renamed helpers, so a value marked `secret` goes to the vault and a read answers `{ "$secret": "<name>" }` for it exactly as it did for `writeOnly`.

A registration's schema still loads when a vault field is marked `writeOnly` with no `secret`, and the load gives exactly one problem line for it, reason `writeOnly kept in the vault; mark it secret`. `validate.ts` walks `properties`, `additionalProperties` and `items` for those nodes, and `checkAgent`, `checkAdapter` and `checkEngine` report them beside the existing `schemaGaps` lines. Registration gaps are alerts and never refuse a load.

The two masks read both keywords. `packages/server/src/commands/config.ts` answers `<set>` for `secret: true` as for `writeOnly: true`, with `NOTHING_MARKED` unchanged, and `secretsOf` in `packages/server/src/pluginschannel.ts` takes a `secret` value out of a served load problem.

Every first-party vault field says `secret: true`: the proxy `KEY`, the webhook `secret` and `verifyToken`, the activepieces auth fields, pi's key variables, acp's machine env and sign-in env, and claude's `LOGIN.token` and `MODEL_SOURCE.key`. A plugin option in `package.json`, the root configuration in `commands/options.ts` and the two masks keep `writeOnly`, which keeps its JSON Schema meaning.

## Departures from the plan

- `packages/agent-cofold/src/plugin.ts` - the engine schema spreads the plugin's `package.json` options, which step 3 of task 03 keeps `writeOnly` because the vault never holds them. The daemon key is one of them, so `kindSchema` now overrides `apiKey` with `secret: true`, because a record's key is a vault field. Without it the plugin would carry a `writeOnly kept in the vault` line at every start. This file is not in task 03's Files list.
- `packages/server/test/schema-gaps.test.ts` - a new describe asserts that no first-party plugin gives a `writeOnly kept in the vault` line. It is the check step 7 of task 03 asks for.
- `packages/server/test/fixtures/plugin-throws-secret/{package.json,index.ts}` - the fixture's quoted option now carries a `secret` field, so the test reads a `secret` value as well as a `writeOnly` one.
- Task 03's Files list was incomplete. The tests that assert a vault field also had to change in `packages/agent-acp/test/agent-acp-presets.test.ts`, `packages/agent-claude/test/agent-claude-options-schema.test.ts`, `packages/agent-pi/test/engine.test.ts`, `packages/server/test/openrouter-signin.test.ts`, `packages/activepieces/test/pieces.test.ts` and `packages/agent-cofold/test/engine.test.ts`.

## Verification

- `pnpm typecheck` passes.
- `pnpm test` passes.
- `rg -n "writeOnly" packages/*/src` names only the plugin options in `commands/options.ts`, the two masks, the `isSecret` fallback, the `writeOnly` gap helper and the comments beside them.
