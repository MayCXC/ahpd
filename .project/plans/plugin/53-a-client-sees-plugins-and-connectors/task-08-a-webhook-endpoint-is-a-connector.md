---
title: A webhook endpoint is a connector
status: todo
depends: [task-07-a-client-makes-connectors.md]
layer: "webhook"
refs:
  - "[code://packages/webhook/src/plugin.ts#L217-L226](../../../../packages/webhook/src/plugin.ts#L217-L226) - the `webhooks` records and the route"
  - "[code://packages/webhook/src/record.ts#L16-L31](../../../../packages/webhook/src/record.ts#L16-L31) - `Endpoint` and `checkEndpoint`"
  - "[code://packages/webhook/src/route.ts](../../../../packages/webhook/src/route.ts) - `webhookRoute`, which finds an endpoint by id"
---

## Objective

The webhook plugin registers the connector kind `webhook`.
A person makes an endpoint from a client, and its URL is `/plugins/webhook/<id>`.
The plugin no longer reads the `webhooks` collection.

## Files

- `CREATE: packages/webhook/src/kind.ts` - the `webhook` kind, its schema and its `receive` capability.
- `UPDATE: packages/webhook/src/plugin.ts:217-226` - register the kind, and give the route the open connectors.
- `UPDATE: packages/webhook/src/record.ts:16-31` - make `secret` the secret value, not a vault name.
- `UPDATE: packages/webhook/package.json` - add `webhook` to `ahpd.contracts.connectors`.
- `UPDATE: packages/webhook/test/webhook-route.test.ts` - endpoints come from connectors.
- `CREATE: packages/webhook/test/webhook-kind.test.ts` - the cases below.

## Steps

1. Write the schema from the `Endpoint` fields, with `secret` as a `writeOnly` string.
2. Make `bot` and `automation` a `oneOf`, so a client draws a choice.
3. Declare one `receive` capability, titled "Receives calls".
4. In `open`, check the config with `checkEndpoint`, and keep the endpoint in a map by id.
5. In the answered `close`, remove it from the map.
6. Give the route `endpoint: (id) => map.get(id)`, and compare the secret it holds.
7. Remove `host.records('webhooks')`.
8. Keep `webhook-threads` keyed by the endpoint id.
9. Run the webhook tests, and set this task and the plan row to `done`.

## Validation

- `webhook-kind.test.ts`: two connectors answer their own URLs, and a removed one answers 404.
- `webhook-kind.test.ts`: the route refuses a call with the wrong bearer.
- `webhook-kind.test.ts`: a `webhooks/<id>.md` file on disk makes no endpoint.
- `pnpm -s exec vitest run packages/webhook` passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a remade endpoint with the same id keeps its threads.
