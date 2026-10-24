---
title: A fetched model is callable
status: todo
depends: [task-01-an-adapter-lists-its-models.md, task-02-the-host-adapters-list-their-models.md]
layer: "server"
refs:
  - "[code://packages/sdk/src/connectors/channel.ts#L155](../../../../packages/sdk/src/connectors/channel.ts#L155) - `providers()`, the connectors a catalog follows"
  - "[code://packages/server/src/proxy/route.ts#L135](../../../../packages/server/src/proxy/route.ts#L135) - `route`, which refuses a name the table does not hold"
  - "[code://packages/server/src/proxy/listener.ts#L273](../../../../packages/server/src/proxy/listener.ts#L273) - `costOf`, which prices a call from the entry"
  - "[code://packages/sdk/src/access/decide.ts#L68](../../../../packages/sdk/src/access/decide.ts#L68) - a policy value with `*`"
---

## Objective

The host keeps each provider connector's list in memory.
A call of `<prefix>/<id>` that the table does not hold goes to the connectors with that prefix, in proxy 04's tier order.

## Files

- `CREATE: packages/server/src/proxy/catalog.ts` - the catalog: each open provider connector's list, fetched at first sight and each hour.
- `UPDATE: packages/server/src/proxy/route.ts` - a name not in the table is read as `<prefix>/<id>`.
- `UPDATE: packages/server/src/proxy/listener.ts` - `ProxyOptions` gets the catalog, and `costOf` reads a fetched price.
- `UPDATE: packages/server/src/commands/run.ts` - build the catalog from the connectors channel and the adapters, and stop its timer at shutdown.
- `CREATE: packages/server/test/proxy-catalog.test.ts` - the fetch, the hourly fetch, a failed fetch and a closed connector.
- `UPDATE: packages/server/test/proxy-route.test.ts` - fetched names, prefixes and the table's priority.

## Steps

1. Make the catalog read `providers()` and fetch `models` for each connector it has not seen.
2. Key the catalog by owner and connector id, because two owners can use one id.
3. Fetch each connector again each hour, with a timer that does not hold the process open.
4. Keep the last list when a fetch fails, and write one line to the log that names the connector.
5. Remove a connector from the catalog when `providers()` no longer lists it.
6. Give the catalog a `prefixOf(connector)` that answers `provider.prefix` or the adapter name.
7. In `route`, keep the table's entries for a name that the table holds.
8. For any other name, split it at the first slash into a prefix and an id.
9. Take the connectors whose prefix is that prefix, and refuse the name as today when there are none.
10. Order those connectors by proxy 04's tiers, and give each the entry `{ provider: adapter, id }`.
11. Send the call when the list does not hold the id, so the provider answers it.
12. Give the entry the fetched price, per million tokens, when the connector's list holds the id with `pricing`.
13. Keep the policy check on the whole name, so `openrouter/*` allows every OpenRouter model.
14. Test a fetched name, a compatible connector by its id, and a table name that wins.
15. Test a call of a name before the first fetch.

## Validation

- `proxy-catalog.test.ts` and `proxy-route.test.ts` pass.
- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.
- The daemon tests end with no open handle, so shutdown stops the timer.

## Resume
