---
title: AGENTS.md uses the host's YAML
status: todo
depends: [task-01-agents-md-has-parts-the-ui-owns.md]
layer: "packages/bot"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L564-L566](../../../../packages/sdk/src/types/plugin.ts#L564-L566) - `parseYaml` and `stringifyYaml` on the plugin context"
  - "[code://packages/server/src/plugins.ts#L916-L918](../../../../packages/server/src/plugins.ts#L916-L918) - the server gives a plugin its own YAML subset"
  - "[code://packages/bot/src/agents.ts](../../../../packages/bot/src/agents.ts) - imports `@cofold/yaml` directly"
---

## Objective

`agents.ts` reads and writes YAML with the plugin context's `parseYaml` and `stringifyYaml`.
`@ahpd/bot` has no runtime dependency again, only its `@ahpd/sdk` peer.

## Files

- `UPDATE: packages/bot/src/agents.ts` - take the two YAML functions as a seam, not as an import.
- `UPDATE: packages/bot/package.json` - remove `@cofold/yaml`.
- `UPDATE: pnpm-lock.yaml` - the lock without the removed dependency.
- `UPDATE: packages/bot/test/bot-agents.test.ts` - give the tests a YAML seam.

## Steps

1. Add a `Yaml` type with `parseYaml` and `stringifyYaml`, as `PluginContext` names them.
2. Make `readAgents` and `writeAgents` take a `Yaml` value as their first argument.
3. Remove the import of `@cofold/yaml` from `agents.ts`.
4. Remove `@cofold/yaml` from `packages/bot/package.json` and update the lock.
5. In the tests, use the YAML parser that other plugin tests use.

## Validation

- `bot-agents.test.ts` passes with the seam.
- `pnpm -s boundary` passes with no runtime dependency on `@ahpd/bot`.
- The gates pass: build, typecheck, boundary, schema and vitest.
