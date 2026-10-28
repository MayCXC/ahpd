---
title: A connector lists its models to a client - implemented
date: 2026-10-28
refs:
  - git://d6b282f9 - the base; the change is not committed
  - "[code://packages/server/src/proxy/listener.ts](../../../../packages/server/src/proxy/listener.ts) - `connectorModels`"
  - "[code://packages/sdk/src/connectors/channel.ts](../../../../packages/sdk/src/connectors/channel.ts) - the `models` command"
---

A client asks `x-ahpd/connectors/models { id }` for the models of one open provider connector.
Each model carries the name a caller sends, and whether this reader may call it now.

## What was built

- [`code://packages/sdk/src/types/connectors.ts`](../../../../packages/sdk/src/types/connectors.ts) - `ConnectorModel` and `ConnectorModels`.
- [`code://packages/sdk/src/connectors/channel.ts`](../../../../packages/sdk/src/connectors/channel.ts) - the `models` option and command.
- [`code://packages/server/src/proxy/catalog.ts`](../../../../packages/server/src/proxy/catalog.ts) - `listOf`.
- [`code://packages/server/src/proxy/listener.ts`](../../../../packages/server/src/proxy/listener.ts) - `firstCandidate`, shared with `GET /v1/models`, and `connectorModels`.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - one proxy options value, read by the proxy and the channel.
- [`code://docs/plugins/PLUGINS.md`](../../../../docs/plugins/PLUGINS.md) and [`code://docs/server/PROXY.md`](../../../../docs/server/PROXY.md) - the command.

## Verified

- `pnpm typecheck` passes.
- `packages/sdk/test/connectors-models.test.ts`: 4 cases pass, with the other sdk connector tests, 78 in all.
- `packages/server/test/proxy-listener.test.ts` and the catalog tests: 54 pass, with the 2 new `connectorModels` cases.

## Departures from the plan

- none.

## Left for later

- The model picker does not list connector models.
