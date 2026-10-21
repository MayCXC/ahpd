---
title: A client makes connectors
status: todo
depends: [task-05-a-plugin-registers-connector-kinds.md, task-06-a-collection-keeps-json-records.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/resources/recordschannel.ts#L72](../../../../packages/sdk/src/resources/recordschannel.ts#L72) - `recordsChannel`, with `ownerOf` and `?owner=me`"
  - "[code://packages/sdk/src/types/vault.ts#L18-L26](../../../../packages/sdk/src/types/vault.ts#L18-L26) - `Vault.set` and `delete`"
  - "[code://packages/server/src/rootconfig.ts#L117-L140](../../../../packages/server/src/rootconfig.ts#L117-L140) - `conforming`, the JSON Schema subset a client already draws"
  - "[code://packages/server/src/commands/run.ts#L632-L647](../../../../packages/server/src/commands/run.ts#L632-L647) - `servedRecords('ahpd', ...)`"
---

## Objective

A client subscribes to `x-ahpd-connectors` and gets the kinds and the connectors.
A client calls `x-ahpd/connectors/put` and `remove`, and the host opens or closes the connector.
A secret is written to the vault, and is in no record and no snapshot.

## Files

- `CREATE: packages/sdk/src/connectors/channel.ts` - the channel, the two methods and the open connectors.
- `UPDATE: packages/sdk/src/index.ts` - export `connectorsChannel`.
- `UPDATE: packages/server/src/commands/run.ts:632-647` - open the `connectors` JSON collection, and add the channel and methods to `servedRecords`.
- `CREATE: packages/sdk/test/connectors-channel.test.ts` - the cases below.

## Steps

1. Serve one row for each kind, with its name, title, description, schema, capabilities and plugin.
2. Serve one row for each connector, with `state` as `open`, `unavailable` or `invalid`.
3. Give `ownerOf` from the connector's owner, so `?owner=me` lists the caller's own.
4. In `put`, refuse a kind that is not registered.
5. In `put`, check `config` against the kind's schema, and answer the first error.
6. Move each `writeOnly` value to the vault, as `connector/<id>/<field>` in the owner's scope.
7. Write the record with a `{ "$secret": "<name>" }` in place of each moved value.
8. Close the open connector with the same id, then call the kind's `open` with the secrets read back.
9. In `remove`, close the connector, delete its secrets and delete the record.
10. Require the owner's grant: root for `host`, the team's secret grant for `team:<team>`, and that person for `user:<id>`.
11. Open every stored connector of a registered kind when the daemon starts.
12. Run the SDK tests, and set this task and the plan row to `done`.

## Validation

- `connectors-channel.test.ts`: a kind shows before any connector exists.
- `connectors-channel.test.ts`: two `put` calls of one kind make two connectors, and the host calls `open` for each.
- `connectors-channel.test.ts`: a `writeOnly` value is in the vault and in no record and no snapshot.
- `connectors-channel.test.ts`: a `put` of an empty `writeOnly` field keeps the stored secret.
- `connectors-channel.test.ts`: a connector of an unregistered kind shows as `unavailable` and does not open.
- `connectors-channel.test.ts`: `?owner=me` lists only the caller's connectors.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a client sends an empty `writeOnly` field to keep the secret, because it never sees the stored value.
