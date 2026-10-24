---
title: List every provider under its own id
status: todo
depends: []
layer: "agent-cofold"
refs:
  - "[code://packages/agent-cofold/src/agent.ts#L233-L269](../../../../packages/agent-cofold/src/agent.ts#L233-L269) - `connectionOf`"
  - "[code://packages/agent-cofold/src/agent.ts#L546-L577](../../../../packages/agent-cofold/src/agent.ts#L546-L577) - `listModels`, `catalogueOf` and `knownCatalogue`"
  - "[code://packages/agent-cofold/src/agent.ts#L733-L739](../../../../packages/agent-cofold/src/agent.ts#L733-L739) - `probe`"
  - "[code://packages/agent-cofold/src/agent.ts#L833](../../../../packages/agent-cofold/src/agent.ts#L833) - `create`"
---

## Objective

The model list has the models of every file provider, each id as `<provider id>/<model id>`, and each provider is asked with its own key.

## Files

- `UPDATE: packages/agent-cofold/src/agent.ts` - add `connectionsOf`, change the key rule in `connectionOf`, and make `probe` and `create` merge the catalogues.
- `UPDATE: packages/agent-cofold/test/agent-cofold-models.test.ts` - tests for two providers, their prefixes and their keys.

## Steps

1. Add `connectionsOf(options, settings, credentials, harness)` next to `connectionOf`.
2. Without an explicit `baseUrl`, return one connection per file provider, with the provider id as `prefix`.
3. With an explicit `baseUrl`, or with no file provider, return the one connection of `connectionOf`.
4. Give each file provider connection its own `apiKey` and `headers`.
5. Give the lent key and `options.apiKey` only to the connection whose base URL origin equals `resourceOf`.
6. Remove the fallback to `providers[0].apiKey` for an endpoint that is not that provider's.
7. Apply the same key rule in `connectionOf`, so a turn uses the key that its listing used.
8. Make `probe` ask every connection in parallel and merge the rows in file order.
9. Keep the configured reference first in `probe` when no catalogue has it.
10. Make the catalogue that `create` gives a session merge `knownCatalogue` over every connection.
11. Add a test with two file providers that expects both sets of ids, each under its provider id.
12. Add a test that each provider's `GET /models` carries that provider's key and no other key.
13. Add a test that a provider that fails adds no rows while the other still lists.
14. Change the test at line 190 so that it expects `open_router/` ids with no `model` configured.

## Validation

- `pnpm -s vitest run packages/agent-cofold` passes.
- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a key must never reach an endpoint of another provider. A status, error or log must not carry a key.
