---
title: A test walks every first-party schema
status: todo
depends:
  - task-01-every-schema-entry-point-checks.md
  - task-02-claude-lists-models-and-sources.md
  - task-03-plugin-schemas-have-no-gap.md
  - task-04-the-host-config-names-its-maps.md
layer: "server"
refs:
  - "[code://packages/activepieces/test/pieces.test.ts#L62-L69](../../../../packages/activepieces/test/pieces.test.ts#L62-L69) - the pattern: a stub host that keeps what `apply` registers"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1500](../../../../packages/sdk/src/host/sessionmethods.ts#L1500) - a backend's session config schema"
---

## Objective

A test fails when any first-party schema has a gap, so a new gap cannot merge.

## Files

- `CREATE: packages/server/test/schema-gaps.test.ts` - walk every schema that the first-party plugins and the host register.

## Steps

1. Load each first-party plugin with a stub host that keeps each schema it registers.
2. Walk each manifest's `optionsSchema`.
3. Walk each engine, adapter, capability input, trigger, session config property and agent schema.
4. Walk each backend's session config schema.
5. Walk the host's `configSchema`, `mcpServerSchema` and `proxySchema`.
6. Fail the test with each gap's plugin, place and path.

## Validation

- The test passes.
- Put `{ type: 'object' }` back on Claude's `env`, and the test fails with that path.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** the activepieces walk needs the shipped pieces only. A piece that is not shipped makes `apply` call `install`.
