---
title: The sdk declares the record store
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/plugins.ts#L86-L89](../../../../packages/sdk/src/plugins.ts#L86-L89) - `PORT_KEYS`"
  - "[code://packages/sdk/src/plugins.ts#L935](../../../../packages/sdk/src/plugins.ts#L935) - `registerAutomations`, the shape of a port setter"
---

## Objective

`RecordStore` is a host port, and `host.records(name, options)` answers a collection over the folded port.
`memoryRecords()` is a record store that keeps records in memory.

## Files

- `CREATE: packages/sdk/src/types/records.ts` - `RecordStore`, `RecordCollection`, `RecordChange` and `CollectionOptions`.
- `CREATE: packages/sdk/src/records.ts` - `memoryRecords()`.
- `UPDATE: packages/sdk/src/types/host.ts` - `HostOptions.records`.
- `UPDATE: packages/sdk/src/types/plugin.ts` - `registerRecords` and `records` on `PluginHost`.
- `UPDATE: packages/sdk/src/plugins.ts:86-89` - `records` in `PORT_KEYS`, `registerRecords`, and `records` resolved at call time.
- `UPDATE: packages/sdk/src/types/index.ts` - export the new types.
- `UPDATE: packages/sdk/src/index.ts` - export `memoryRecords`.
- `CREATE: packages/sdk/test/plugin-records.test.ts` - cases for the port and the collection.

## Steps

1. Declare `RecordCollection` with `get(id)`, `list()`, `find(match)`, `put(record)`, `remove(id)` and `watch(onChange)`.
2. Make each call answer a promise, and make `watch` answer a function that stops the watch.
3. Declare `RecordChange` as `{ id, type }`, with `type` one of `added`, `updated` and `deleted`.
4. Declare `RecordStore` with `collection(name, options)`, and `CollectionOptions` with an optional `body` field name.
5. Add `records` to `HostOptions`, `PortKey` and `PORT_KEYS`.
6. Add `registerRecords(store, when?)` to `PluginHost`, and set the port with `setPort`.
7. Add `records(name, options?)` to `PluginHost`, and answer a collection whose calls wait for the fold.
8. Refuse a name that is not a slug, and a name that another plugin opened.
9. Throw from each collection call when the host has no records port.
10. Write `memoryRecords()` with the same rules, and tell watchers of each `put` and `remove`.
11. Refuse a record whose `id` is not a slug in `put`.

## Validation

- `plugin-records.test.ts` replaces the port with `memoryRecords`, and a collection opened in `apply` reads and writes through it after the fold.
- The host refuses a second plugin that opens the same name, and the first keeps its collection.
- `find({ owner: 'ana' })` answers only the records whose `owner` is `ana`.
- A watcher hears `added`, `updated` and `deleted`, and hears nothing after it stops.
- `pnpm exec vitest run packages/sdk` and `pnpm -s typecheck` pass.

## Resume
