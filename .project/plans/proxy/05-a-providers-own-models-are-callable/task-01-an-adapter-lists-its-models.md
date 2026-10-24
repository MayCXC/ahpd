---
title: An adapter lists its models
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/connectors.ts#L78](../../../../packages/sdk/src/types/connectors.ts#L78) - `ModelProvider`, which gets `prefix`"
  - "[code://packages/sdk/src/types/connectors.ts#L177-L204](../../../../packages/sdk/src/types/connectors.ts#L177-L204) - `Adapter`, which gets `models`"
  - https://openrouter.ai/docs/api-reference/list-available-models - the field names `ProviderModel` copies
---

## Objective

A provider adapter can answer the models a connector serves, in OpenRouter's field names.
A provider can name the first segment of its fetched model names.

## Files

- `UPDATE: packages/sdk/src/types/connectors.ts` - the `ProviderModel` and `ModelPricing` types, `ModelProvider.prefix` and `Adapter.models`.
- `UPDATE: packages/sdk/src/types/index.ts` - export the new types.
- `UPDATE: packages/sdk/src/index.ts` - export the new types.

## Steps

1. Add `ModelPricing { prompt?: string; completion?: string }`, with a comment that each is dollars per token, as OpenRouter writes it.
2. Add `ProviderModel { id: string; name?: string; context_length?: number; pricing?: ModelPricing }`.
3. Add `prefix?: string` to `ModelProvider`, with a comment that it is the adapter name when absent.
4. Add `models?(connector: Connector): Promise<ProviderModel[]>` to `Adapter`, with a comment that it reads the connector's resolved config.
5. Export the new types from both index files.

## Validation

- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.

## Resume
